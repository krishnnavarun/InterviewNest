// Turns resume + job description + past weaknesses into a structured
// interview plan (topics, opening questions and scoring rubrics).
import { createHash } from 'node:crypto';
import { generateJSON } from '../ai/gemini.js';
import { GapAnalysisSchema, InterviewPlanSchema } from '../ai/schemas.js';
import { gapAnalysisPrompt, interviewPlanPrompt } from '../ai/prompts.js';
import { AppError } from '../lib/AppError.js';

const gapKey = (roleId, jobDescription) =>
  createHash('sha256').update(`${roleId}\n${jobDescription.trim()}`).digest('hex');

/** Job-description gap analysis, cached on the resume document. */
export async function analyzeJobDescription({ resume, role, jobDescription, userId }) {
  const key = gapKey(role.id, jobDescription);
  if (resume.lastGap?.key === key) return resume.lastGap.result;

  const { data } = await generateJSON({
    feature: 'jd_gap_analysis',
    ...gapAnalysisPrompt({ role, profile: resume.profile, jobDescription }),
    schema: GapAnalysisSchema,
    temperature: 0.2,
    thinking: 'low',
    timeoutMs: 25000,
    context: { userId },
  });

  resume.lastGap = { key, result: data };
  await resume.save();
  return data;
}

/** Generate the plan, then enforce structure in code (never trust the model blindly). */
export async function createInterviewPlan({ role, difficulty, profile, gap, weakAreas, userId }) {
  const firstName = profile.name?.split(' ')[0] || '';
  const { data, meta } = await generateJSON({
    feature: 'interview_plan',
    ...interviewPlanPrompt({ role, difficulty, profile, gap, weakAreas, firstName }),
    schema: InterviewPlanSchema,
    temperature: 0.7, // some variety between interviews
    thinking: 'low',
    timeoutMs: 40000,
    context: { userId },
  });
  return { plan: normalizePlan(data, difficulty), meta };
}

export function normalizePlan(plan, difficulty) {
  let topics = [...plan.topics];

  // Exactly one coding topic, always last.
  const codingTopic = topics.find((topic) => topic.kind === 'coding');
  topics = topics.filter((topic) => topic.kind !== 'coding');
  // Intro first.
  const introIndex = topics.findIndex((topic) => topic.kind === 'intro');
  if (introIndex > 0) topics.unshift(...topics.splice(introIndex, 1));

  topics = topics.slice(0, difficulty.topicCount - 1);
  topics.push(
    codingTopic ?? {
      title: 'Coding exercise',
      kind: 'coding',
      openingQuestion: "Let's switch to a short hands-on coding exercise - the problem is on your screen now.",
      whyThisTopic: 'Hands-on coding is part of every technical interview loop.',
      rubric: [
        { criterion: 'Explains their approach and its complexity clearly', dimension: 'coding', lookFor: 'Correct Big-O with justification' },
        { criterion: 'Reasons about edge cases and trade-offs', dimension: 'problem_solving', lookFor: 'Mentions empty/large inputs and alternatives' },
      ],
    }
  );

  if (topics.length < 3) throw new AppError(502, 'The AI produced an incomplete interview plan. Please try again.');

  return {
    greeting: plan.greeting,
    topics: topics.map((topic, index) => ({
      ...topic,
      id: `t${index + 1}`,
      // One follow-up for intro and the verbal part of coding; difficulty-based otherwise.
      maxFollowUps: topic.kind === 'intro' || topic.kind === 'coding' ? 1 : difficulty.maxFollowUps,
    })),
  };
}
