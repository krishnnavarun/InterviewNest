// Practice drills: one targeted question (aimed at the weakest skill by
// default) with instant, evidence-grounded rubric feedback.
import Drill from '../models/Drill.js';
import Resume from '../models/Resume.js';
import { generateJSON } from '../ai/gemini.js';
import { DrillFeedbackSchema, DrillQuestionSchema } from '../ai/schemas.js';
import { drillFeedbackPrompt, drillQuestionPrompt } from '../ai/prompts.js';
import { DIMENSIONS, getRole } from '../config/interview.constants.js';
import { sanitizeEvaluation } from '../lib/grounding.js';
import { topicScore } from '../lib/scoring.js';
import { AppError, notFound } from '../lib/AppError.js';
import { assertWithinQuota } from './usage.service.js';
import { getWeakAreas } from './progress.service.js';

const toView = (drill) => ({
  id: drill._id,
  role: drill.role,
  roleTitle: drill.roleTitle,
  dimension: drill.dimension ?? null,
  dimensionLabel: drill.dimension ? DIMENSIONS[drill.dimension]?.label : null,
  topicTitle: drill.topicTitle,
  kind: drill.kind,
  question: drill.question,
  whyThisDrill: drill.whyThisDrill,
  rubric: drill.status === 'answered' ? drill.rubric : drill.rubric.map(({ criterion, dimension }) => ({ criterion, dimension })),
  status: drill.status,
  answer: drill.answer ?? null,
  feedback: drill.feedback ?? null,
  score: drill.score ?? null,
  createdAt: drill.createdAt,
  answeredAt: drill.answeredAt ?? null,
});

export async function createDrill(userId, { role: roleId, dimension, focus }) {
  await assertWithinQuota(userId);
  const resume = await Resume.findOne({ userId }).select('profile').lean();
  const role = getRole(roleId ?? resume?.profile?.suggestedRoleIds?.[0] ?? 'full-stack-developer') ?? getRole('full-stack-developer');

  // Default target: the weakest skill from past interviews.
  let target = dimension;
  if (!target && !focus) target = (await getWeakAreas(userId))[0]?.dimension;

  const recent = await Drill.find({ userId }).sort({ createdAt: -1 }).limit(8).select('question').lean();
  const { data } = await generateJSON({
    feature: 'drill_question',
    ...drillQuestionPrompt({ role, dimension: target, focus, profile: resume?.profile, avoidQuestions: recent.map((item) => item.question) }),
    schema: DrillQuestionSchema,
    temperature: 0.9,
    thinking: 'off',
    timeoutMs: 20000,
    context: { userId: String(userId) },
  });

  const drill = await Drill.create({ userId, role: role.id, roleTitle: role.title, dimension: target, ...data });
  return toView(drill);
}

export async function answerDrill(userId, drillId, text) {
  const drill = await Drill.findOne({ _id: drillId, userId });
  if (!drill) throw notFound('Drill');
  if (drill.status === 'answered') return toView(drill);
  const answerText = String(text ?? '').trim();
  if (answerText.length < 10) throw new AppError(400, 'Write at least a sentence so there is something to grade.');
  await assertWithinQuota(userId);

  const { data } = await generateJSON({
    feature: 'drill_feedback',
    ...drillFeedbackPrompt({ roleTitle: drill.roleTitle, drill, answerText }),
    schema: DrillFeedbackSchema,
    temperature: 0.3,
    thinking: 'off',
    timeoutMs: 20000,
    context: { userId: String(userId) },
  });

  const evaluation = sanitizeEvaluation(data.evaluation, drill.rubric, answerText);
  drill.answer = answerText.slice(0, 5000);
  drill.feedback = { ...data, evaluation };
  drill.score = topicScore(evaluation);
  drill.status = 'answered';
  drill.answeredAt = new Date();
  await drill.save();
  return toView(drill);
}

export async function listDrills(userId) {
  const drills = await Drill.find({ userId }).sort({ createdAt: -1 }).limit(30);
  const answered = drills.filter((drill) => drill.status === 'answered');
  return {
    items: drills.map(toView),
    stats: {
      answered: answered.length,
      averageScore: answered.length ? Math.round(answered.reduce((sum, drill) => sum + drill.score, 0) / answered.length) : null,
    },
  };
}

export async function getDrill(userId, drillId) {
  const drill = await Drill.findOne({ _id: drillId, userId });
  if (!drill) throw notFound('Drill');
  return toView(drill);
}
