// AI career coach: retrieval-augmented answers over the candidate's own
// interview history.
//
//   index:    every completed interview -> chunks (one per answered topic,
//             the coding round and the report) -> Gemini embeddings (768-d)
//   retrieve: embed the question -> cosine similarity over the user's chunks
//   generate: answer grounded in the top chunks, with numbered citations that
//             are validated server-side before they reach the browser
import mongoose from 'mongoose';
import Interview from '../models/Interview.js';
import CoachChunk from '../models/CoachChunk.js';
import { embedTexts, generateJSON } from '../ai/gemini.js';
import { CoachAnswerSchema } from '../ai/schemas.js';
import { coachPrompt } from '../ai/prompts.js';
import { topK } from '../lib/vector.js';
import { DIMENSIONS } from '../config/interview.constants.js';
import { assertWithinQuota } from './usage.service.js';
import { getProgress } from './progress.service.js';
import { latestTopicEvaluations } from './report.service.js';

const MAX_CHUNK_CHARS = 1600;
const clip = (text) => (text.length > MAX_CHUNK_CHARS ? `${text.slice(0, MAX_CHUNK_CHARS)}...` : text);
const day = (date) => new Date(date).toISOString().slice(0, 10);

/** Build retrieval chunks for one completed interview. */
export function chunkInterview(interview) {
  const when = day(interview.completedAt ?? interview.createdAt);
  const heading = `${interview.roleTitle} (${interview.difficultyLabel}) interview on ${when}`;
  const evaluations = latestTopicEvaluations(interview.turns);
  const chunks = [];

  for (const topic of interview.plan.topics) {
    const turns = interview.turns.filter((turn) => turn.topicId === topic.id);
    const answers = turns.filter((turn) => turn.speaker === 'candidate' && turn.inputMode !== 'code');
    const evaluation = evaluations[topic.id];
    if (!answers.length || !evaluation) continue;
    const score = interview.report?.topicScores?.find((entry) => entry.topicId === topic.id)?.score;
    const questions = turns.filter((turn) => turn.speaker === 'interviewer' && turn.question).map((turn) => turn.question);
    chunks.push({
      kind: 'topic',
      label: `${heading} - ${topic.title}`,
      text: clip(
        [
          `${heading}. Topic: ${topic.title} (${topic.kind}). Score: ${score ?? 'n/a'}/100.`,
          `Questions: ${questions.join(' | ')}`,
          `Candidate answered: ${answers.map((turn) => turn.text).join(' | ')}`,
          `Evaluation: ${evaluation.summary}`,
          `Criteria: ${evaluation.criteria.map((c) => `${c.criterion} (${DIMENSIONS[c.dimension]?.label}) ${c.score}/5`).join('; ')}`,
        ].join('\n')
      ),
    });
  }

  const submission = interview.coding?.submission;
  if (submission) {
    chunks.push({
      kind: 'coding',
      label: `${heading} - coding: ${interview.coding.problem.title}`,
      text: clip(
        `${heading}. Coding problem "${interview.coding.problem.title}" in ${submission.language}: ${submission.results.passed}/${submission.results.total} tests passed. ` +
          `Review: ${submission.review?.summary ?? ''} Complexity: ${submission.review?.timeComplexity ?? 'n/a'}. Issues: ${(submission.review?.issues ?? []).join('; ')}`
      ),
    });
  }

  const report = interview.report;
  if (report) {
    chunks.push({
      kind: 'report',
      label: `${heading} - feedback report`,
      text: clip(
        [
          `${heading}. Overall ${report.overall}/100. ${report.headline}`,
          report.summary,
          `Dimension scores: ${Object.entries(report.dimensions ?? {}).map(([id, value]) => `${DIMENSIONS[id]?.label} ${value}`).join(', ')}`,
          `Strengths: ${(report.strengths ?? []).map((item) => item.point).join('; ')}`,
          `Improvements: ${(report.improvements ?? []).map((item) => `${item.point} - ${item.howToImprove}`).join('; ')}`,
          `Study plan: ${(report.studyPlan ?? []).map((item) => item.topic).join('; ')}`,
        ].join('\n')
      ),
    });
  }
  return chunks.map((chunk) => ({ ...chunk, date: interview.completedAt ?? interview.createdAt }));
}

export async function indexInterview(interview) {
  const chunks = chunkInterview(interview);
  if (chunks.length) {
    const vectors = await embedTexts(chunks.map((chunk) => chunk.text), 'RETRIEVAL_DOCUMENT', { userId: String(interview.userId) });
    await CoachChunk.deleteMany({ interviewId: interview._id });
    await CoachChunk.insertMany(
      chunks.map((chunk, index) => ({ ...chunk, userId: interview.userId, interviewId: interview._id, embedding: vectors[index] }))
    );
  }
  await Interview.updateOne({ _id: interview._id }, { $set: { indexedAt: new Date() } });
  return chunks.length;
}

/** Index any completed interviews that are not in the coach's index yet. */
export async function ensureIndexed(userId) {
  const pending = await Interview.find({ userId, status: 'completed', indexedAt: { $exists: false } }).limit(10);
  let indexed = 0;
  for (const interview of pending) indexed += await indexInterview(interview);
  return indexed;
}

export async function askCoach(userId, { question, history = [] }) {
  await assertWithinQuota(userId);
  await ensureIndexed(userId);

  const [queryVector] = await embedTexts([question], 'RETRIEVAL_QUERY', { userId: String(userId) });
  const chunks = await CoachChunk.find({ userId: new mongoose.Types.ObjectId(String(userId)) })
    .sort({ date: -1 })
    .limit(400)
    .select('interviewId kind label text embedding date')
    .lean();
  const hits = topK(queryVector, chunks, 6, 0.35);
  const sources = hits.map(({ item, score }) => ({
    interviewId: item.interviewId,
    kind: item.kind,
    label: item.label,
    text: item.text,
    score: Math.round(score * 100) / 100,
  }));

  const progress = await getProgress(userId);
  const stats = {
    completedInterviews: progress.stats.completed,
    averageScore: progress.stats.averageScore,
    dimensionAverages: Object.fromEntries(Object.entries(progress.dimensionAverages).map(([id, value]) => [DIMENSIONS[id].label, value])),
    weakAreas: progress.weakAreas.map((area) => area.label),
  };

  const { data } = await generateJSON({
    feature: 'career_coach',
    ...coachPrompt({ question, sources, stats, history }),
    schema: CoachAnswerSchema,
    temperature: 0.4,
    thinking: 'low',
    timeoutMs: 30000,
    context: { userId: String(userId) },
  });

  // Only keep citations that point at a real source.
  const cited = [...new Set(data.citations)].filter((number) => number >= 1 && number <= sources.length);
  return {
    answer: data.answer.replace(/\[(\d+)\]/g, (match, number) => (Number(number) <= sources.length ? match : '')),
    followUps: data.followUps,
    sources: sources.map((source, index) => ({ ...source, number: index + 1, cited: cited.includes(index + 1), text: undefined, excerpt: source.text.slice(0, 280) })),
    indexedChunks: chunks.length,
  };
}
