// Orchestrates a live interview:
//   start  -> plan the interview (resume + JD + past weak areas)
//   answer -> transcribe, grade against the rubric, let the agent pick the next move,
//             enforce guardrails, reply
//   code   -> grade executed test results + AI code review, ask about the solution
//   finish -> deterministic scores + AI-written, evidence-based report
import Interview from '../models/Interview.js';
import Resume from '../models/Resume.js';
import { DIFFICULTIES, getRole } from '../config/interview.constants.js';
import { generateJSON } from '../ai/gemini.js';
import { TurnSchema } from '../ai/schemas.js';
import { interviewTurnPrompt } from '../ai/prompts.js';
import { AppError, notFound } from '../lib/AppError.js';
import { sanitizeEvaluation } from '../lib/grounding.js';
import { resolveNextAction, isFollowUpAction } from '../lib/interviewPolicy.js';
import { computeSpeechMetrics } from '../lib/speechMetrics.js';
import { analyzeJobDescription, createInterviewPlan } from './planner.service.js';
import { requireResume, vocabularyFromProfile } from './resume.service.js';
import { getWeakAreas } from './progress.service.js';
import { assertWithinQuota, countInterviewStart } from './usage.service.js';
import { transcribeAnswer } from './speech.service.js';
import { generateVerifiedProblem, gradeOutputs, reviewSubmission } from './coding.service.js';
import { buildReport, hasGradableWork } from './report.service.js';
import { toHistoryItem, toInterviewView, toStateView, toTurnView } from './interview.view.js';
import CoachChunk from '../models/CoachChunk.js';
import { indexInterview } from './careerCoach.service.js';

const LOCK_MS = 90 * 1000;
const STALE_GENERATION_MS = 2 * 60 * 1000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const farewell = (firstName) =>
  `That's all the questions I have${firstName ? `, ${firstName}` : ''}. Thank you for your time - I'm putting together your feedback report now.`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadOwned(userId, interviewId) {
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) throw notFound('Interview');
  return interview;
}

/** Atomically acquire a short lock so concurrent requests cannot corrupt state. */
async function withInterviewLock(userId, interviewId, work) {
  const now = new Date();
  const interview = await Interview.findOneAndUpdate(
    { _id: interviewId, userId, busyUntil: { $lt: now } },
    { $set: { busyUntil: new Date(now.getTime() + LOCK_MS) } },
    { returnDocument: 'after' }
  );
  if (!interview) {
    await loadOwned(userId, interviewId); // 404 if it does not exist
    throw new AppError(409, 'Your previous answer is still being processed.');
  }
  try {
    return await work(interview);
  } finally {
    await Interview.updateOne({ _id: interviewId }, { $set: { busyUntil: new Date(0) } });
  }
}

const aiContext = (interview) => ({ userId: String(interview.userId), interviewId: String(interview._id) });

function assertActive(interview) {
  if (interview.status !== 'in_progress') throw new AppError(409, 'This interview has already ended.');
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

export async function startInterview(user, { role: roleId, difficulty: difficultyId, jobDescription, focusWeakAreas, voiceEnabled }) {
  const role = getRole(roleId);
  const difficulty = DIFFICULTIES[difficultyId];
  const userId = String(user._id);

  await assertWithinQuota(userId, { startingInterview: true });
  const resume = await requireResume(userId);

  const [gap, weakAreas] = await Promise.all([
    jobDescription ? analyzeJobDescription({ resume, role, jobDescription, userId }) : null,
    focusWeakAreas ? getWeakAreas(userId) : [],
  ]);

  const { plan, meta } = await createInterviewPlan({ role, difficulty, profile: resume.profile, gap, weakAreas, userId });
  const firstTopic = plan.topics[0];

  const interview = await Interview.create({
    userId,
    role: role.id,
    roleTitle: role.title,
    difficulty: difficulty.id,
    difficultyLabel: difficulty.label,
    voiceEnabled,
    jobDescription: jobDescription ?? '',
    gap,
    weakAreasTargeted: weakAreas,
    plan,
    turnBudget: difficulty.turnBudget,
    turns: [
      {
        speaker: 'interviewer',
        topicId: firstTopic.id,
        text: plan.greeting,
        question: firstTopic.openingQuestion,
        action: 'greeting',
      },
    ],
    aiStats: { calls: 1, promptTokens: meta.promptTokens, outputTokens: meta.outputTokens + meta.thoughtsTokens, latencyMs: meta.latencyMs },
  });

  await countInterviewStart(userId);
  return toInterviewView(interview);
}

// ---------------------------------------------------------------------------
// Coding problem (generated ahead of time while the candidate is talking)
// ---------------------------------------------------------------------------

async function claimCodingGeneration(interviewId) {
  const staleBefore = new Date(Date.now() - STALE_GENERATION_MS);
  return Interview.findOneAndUpdate(
    {
      _id: interviewId,
      $or: [
        { 'coding.status': { $in: ['none', 'failed'] } },
        { 'coding.status': 'generating', 'coding.startedAt': { $lt: staleBefore } },
      ],
    },
    { $set: { 'coding.status': 'generating', 'coding.startedAt': new Date() } },
    { returnDocument: 'after' }
  );
}

/** Make sure the coding problem exists. Safe to call concurrently. */
export async function ensureCodingProblem(interviewDoc) {
  const id = interviewDoc._id;
  const claimed = await claimCodingGeneration(id);

  if (!claimed) {
    // Either ready, or another request is generating it right now - wait for it.
    for (let waited = 0; waited < 60; waited++) {
      const fresh = await Interview.findById(id).select('coding').lean();
      if (fresh.coding?.status === 'ready') return fresh.coding;
      if (fresh.coding?.status === 'failed') throw new AppError(502, 'Could not prepare a reliable coding exercise. Please try again.');
      await sleep(1000);
    }
    throw new AppError(503, 'The coding exercise is still being prepared. Please try again in a moment.');
  }

  try {
    const recent = await Interview.find({ userId: claimed.userId, 'coding.status': 'ready' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('coding.problem.title')
      .lean();
    const { problem, verification } = await generateVerifiedProblem({
      role: getRole(claimed.role),
      difficulty: DIFFICULTIES[claimed.difficulty],
      avoidTitles: recent.map((item) => item.coding.problem.title),
      context: aiContext(claimed),
    });
    const coding = { status: 'ready', startedAt: claimed.coding.startedAt, problem, verification };
    await Interview.updateOne(
      { _id: id },
      { $set: { 'coding.status': 'ready', 'coding.problem': problem, 'coding.verification': verification } }
    );
    return coding;
  } catch (error) {
    await Interview.updateOne({ _id: id }, { $set: { 'coding.status': 'failed' } });
    throw error;
  }
}

export async function prepareCoding(userId, interviewId) {
  const interview = await loadOwned(userId, interviewId);
  assertActive(interview);
  if (interview.coding?.status === 'ready') return { status: 'ready' };
  await ensureCodingProblem(interview);
  return { status: 'ready' };
}

// ---------------------------------------------------------------------------
// Answer (the adaptive interviewer loop)
// ---------------------------------------------------------------------------

async function toAnswerText(userId, { text, audio }) {
  if (audio) {
    const resume = await Resume.findOne({ userId }).select('profile').lean();
    const { text: transcript, words } = await transcribeAnswer(audio.buffer, vocabularyFromProfile(resume?.profile));
    if (!transcript) {
      throw new AppError(422, "We couldn't hear an answer in that recording. Check your microphone and try again.");
    }
    return { answerText: transcript, inputMode: 'voice', speech: computeSpeechMetrics(words) };
  }
  const answerText = String(text ?? '').trim();
  if (!answerText) throw new AppError(400, 'Please provide an answer.');
  return { answerText: answerText.slice(0, 5000), inputMode: 'text', speech: null };
}

export async function submitAnswer(user, interviewId, input) {
  const userId = String(user._id);
  return withInterviewLock(userId, interviewId, async (interview) => {
    assertActive(interview);
    if (interview.phase === 'coding') throw new AppError(409, 'Submit your solution to the coding exercise first.');
    if (interview.phase === 'wrap_up') throw new AppError(409, 'The interview is complete - generate your report.');
    await assertWithinQuota(userId);

    const { answerText, inputMode, speech } = await toAnswerText(userId, input);

    const topics = interview.plan.topics;
    const topicIndex = interview.currentTopicIndex;
    const topic = topics[topicIndex];
    const nextTopic = topics[topicIndex + 1] ?? null;

    interview.turns.push({ speaker: 'candidate', topicId: topic.id, text: answerText, inputMode, speech });
    const candidateTurn = interview.turns[interview.turns.length - 1];
    const topicTurns = interview.turns.filter((turn) => turn.topicId === topic.id);

    const submission = interview.coding?.submission;
    const codingContext =
      topic.kind === 'coding' && submission
        ? {
            title: interview.coding.problem.title,
            passed: submission.results.passed,
            total: submission.results.total,
            reviewSummary: submission.review?.summary ?? '',
            code: submission.code,
          }
        : null;

    // 1. The agent grades the answer and proposes the next move (one LLM call).
    const { data: turn } = await generateJSON({
      feature: 'interview_turn',
      ...interviewTurnPrompt({
        interview,
        topic,
        topicIndex,
        nextTopic,
        followUpsUsed: interview.followUpsOnTopic,
        topicTurns,
        coveredTitles: topics.slice(0, topicIndex).map((item) => item.title),
        codingContext,
      }),
      schema: TurnSchema,
      temperature: 0.5,
      thinking: 'off', // latency matters most in a live conversation
      timeoutMs: 15000, // fail fast and move to a backup model
      deadlineMs: 45000,
      context: aiContext(interview),
    });

    // 2. Verify evidence quotes and cap unsupported scores.
    const spokenOnTopic = topicTurns
      .filter((item) => item.speaker === 'candidate' && item.inputMode !== 'code')
      .map((item) => item.text)
      .join('\n');
    candidateTurn.evaluation = sanitizeEvaluation(turn.evaluation, topic.rubric, spokenOnTopic);

    // 3. Guardrails decide what actually happens.
    const policy = resolveNextAction({
      proposed: turn.decision.action,
      topicIndex,
      topicCount: topics.length,
      followUpsUsed: interview.followUpsOnTopic,
      maxFollowUps: topic.maxFollowUps,
      candidateTurns: interview.turns.filter((item) => item.speaker === 'candidate' && item.inputMode !== 'code').length,
      turnBudget: interview.turnBudget,
    });

    const reply = {
      speaker: 'interviewer',
      text: turn.reply.acknowledgment,
      action: policy.action,
      reasoning: turn.decision.reasoning,
      policyOverride: policy.overridden ? `${turn.decision.action} -> ${policy.action} (${policy.reason})` : undefined,
    };

    if (isFollowUpAction(policy.action)) {
      interview.followUpsOnTopic += 1;
      Object.assign(reply, { topicId: topic.id, question: turn.reply.question || 'Could you expand on that a little more?' });
    } else if (policy.action === 'next_topic') {
      interview.currentTopicIndex += 1;
      interview.followUpsOnTopic = 0;
      const modelQuestion = !policy.overridden && turn.reply.question ? turn.reply.question : '';
      Object.assign(reply, { topicId: nextTopic.id, question: modelQuestion || nextTopic.openingQuestion });
      if (nextTopic.kind === 'coding') {
        interview.phase = 'coding';
        interview.coding = await ensureCodingProblem(interview);
        // The model wrote its transition before the problem existed, so it
        // cannot describe it accurately - announce the real problem instead.
        reply.question = `Let's move to a short hands-on coding exercise: "${interview.coding.problem.title}". The full problem is on your screen - run the examples first, then submit when you're happy with it.`;
      }
    } else {
      interview.phase = 'wrap_up';
      const firstName = user.name?.split(' ')[0];
      Object.assign(reply, { topicId: topic.id, text: `${turn.reply.acknowledgment} ${farewell(firstName)}`.trim(), question: '' });
    }

    interview.turns.push(reply);
    await interview.save();

    const turns = interview.turns;
    return {
      candidateTurn: toTurnView(turns[turns.length - 2], turns.length - 2, false),
      interviewerTurn: toTurnView(turns[turns.length - 1], turns.length - 1, false),
      state: toStateView(interview),
      coding: interview.phase === 'coding' ? toInterviewView(interview).coding : undefined,
    };
  });
}

// ---------------------------------------------------------------------------
// Code submission
// ---------------------------------------------------------------------------

export async function submitCode(user, interviewId, { language, code, outputs }) {
  const userId = String(user._id);
  return withInterviewLock(userId, interviewId, async (interview) => {
    assertActive(interview);
    if (interview.phase !== 'coding' || interview.coding?.status !== 'ready') {
      throw new AppError(409, 'There is no coding exercise waiting for a submission.');
    }
    await assertWithinQuota(userId);

    const problem = interview.coding.problem;
    const results = gradeOutputs(problem, outputs);
    const review = await reviewSubmission({
      roleTitle: interview.roleTitle,
      problem,
      language,
      code,
      results,
      context: aiContext(interview),
    });

    const topic = interview.plan.topics[interview.currentTopicIndex];
    interview.set('coding.submission', { language, code, results, review, submittedAt: new Date() });
    interview.turns.push({
      speaker: 'candidate',
      topicId: topic.id,
      inputMode: 'code',
      text: `Submitted a ${language} solution (${results.passed}/${results.total} tests passed).`,
    });
    interview.turns.push({
      speaker: 'interviewer',
      topicId: topic.id,
      text: review.acknowledgment,
      question: review.followUpQuestion,
      action: 'code_review',
      reasoning: 'Asks the candidate to reason about their own solution after reviewing it.',
    });
    // The question about the solution uses this topic's follow-up.
    interview.followUpsOnTopic = 1;
    interview.phase = 'conversation';
    await interview.save();

    const turns = interview.turns;
    return {
      results,
      candidateTurn: toTurnView(turns[turns.length - 2], turns.length - 2, false),
      interviewerTurn: toTurnView(turns[turns.length - 1], turns.length - 1, false),
      state: toStateView(interview),
    };
  });
}

// ---------------------------------------------------------------------------
// Finish + queries
// ---------------------------------------------------------------------------

export async function finishInterview(user, interviewId) {
  const userId = String(user._id);
  return withInterviewLock(userId, interviewId, async (interview) => {
    if (interview.status === 'completed') return toInterviewView(interview);

    if (!hasGradableWork(interview)) {
      interview.status = 'abandoned';
      interview.phase = 'done';
      interview.completedAt = new Date();
      await interview.save();
      return toInterviewView(interview);
    }

    const report = await buildReport(interview, aiContext(interview));
    interview.report = report;
    interview.overallScore = report.overall;
    interview.dimensionScores = report.dimensions;
    interview.status = 'completed';
    interview.phase = 'done';
    interview.completedAt = new Date();
    await interview.save();
    // Add the interview to the career coach's search index (best effort; the
    // coach also indexes lazily, so a failure here is never user-visible).
    indexInterview(interview).catch((error) => console.warn('[coach] indexing failed:', error.message));
    return toInterviewView(interview);
  });
}

export async function getInterview(userId, interviewId) {
  return toInterviewView(await loadOwned(userId, interviewId));
}

export async function getSpeechText(userId, interviewId, turnIndex) {
  const interview = await Interview.findOne({ _id: interviewId, userId }).select('turns voiceEnabled').lean();
  if (!interview) throw notFound('Interview');
  const turn = interview.turns[turnIndex];
  if (!turn || turn.speaker !== 'interviewer') throw new AppError(400, 'Only interviewer turns can be spoken.');
  return [turn.text, turn.question].filter(Boolean).join(' ');
}

export async function listInterviews(userId, { page = 1, limit = 10 }) {
  const filter = { userId, status: { $ne: 'abandoned' } };
  const [items, total] = await Promise.all([
    Interview.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('roleTitle difficultyLabel status overallScore report.headline createdAt completedAt')
      .lean(),
    Interview.countDocuments(filter),
  ]);
  return { items: items.map(toHistoryItem), total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function deleteInterview(userId, interviewId) {
  const deleted = await Interview.findOneAndDelete({ _id: interviewId, userId });
  if (!deleted) throw notFound('Interview');
  await CoachChunk.deleteMany({ interviewId });
}
