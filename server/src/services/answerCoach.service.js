// Answer coach: for a completed interview topic, rewrite the candidate's own
// answer into a stronger one. Numbers the candidate never said are replaced
// with [metric] placeholders (fact guard), so the coach cannot invent results.
import Interview from '../models/Interview.js';
import Resume from '../models/Resume.js';
import { generateJSON } from '../ai/gemini.js';
import { AnswerCoachSchema } from '../ai/schemas.js';
import { answerCoachPrompt } from '../ai/prompts.js';
import { findUnsupportedSentences, guardNumbers } from '../lib/factGuard.js';
import { AppError, notFound } from '../lib/AppError.js';
import { assertWithinQuota } from './usage.service.js';
import { latestTopicEvaluations } from './report.service.js';

export async function coachTopic(userId, interviewId, topicId) {
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) throw notFound('Interview');
  if (interview.status !== 'completed') throw new AppError(409, 'Coaching is available once the interview is complete.');
  if (interview.coaching?.[topicId]) return interview.coaching[topicId];

  const topic = interview.plan.topics.find((item) => item.id === topicId);
  if (!topic) throw notFound('Topic');
  const evaluation = latestTopicEvaluations(interview.turns)[topicId];
  const answers = interview.turns.filter((turn) => turn.topicId === topicId && turn.speaker === 'candidate' && turn.inputMode !== 'code');
  if (!evaluation || answers.length === 0) throw new AppError(400, 'There is no spoken answer on this topic to coach.');

  await assertWithinQuota(userId);
  const question = interview.turns.find((turn) => turn.topicId === topicId && turn.speaker === 'interviewer')?.question ?? topic.openingQuestion;
  const answerText = answers.map((turn) => turn.text).join('\n\n');
  const resume = await Resume.findOne({ userId }).select('profile').lean();

  const { data } = await generateJSON({
    feature: 'answer_coach',
    ...answerCoachPrompt({ roleTitle: interview.roleTitle, topic, question, answerText, evaluation, profile: resume?.profile }),
    schema: AnswerCoachSchema,
    temperature: 0.5,
    thinking: 'low',
    timeoutMs: 30000,
    context: { userId: String(userId), interviewId: String(interviewId) },
  });

  const source = `${answerText}\n${JSON.stringify(resume?.profile ?? {})}`;
  const guarded = guardNumbers(data.improvedAnswer, source);
  const result = {
    ...data,
    improvedAnswer: guarded.text,
    guardedNumbers: guarded.replaced,
    // Sentences the candidate never said: shown flagged, never as their facts.
    unsupportedSentences: findUnsupportedSentences(guarded.text, source),
    question,
    generatedAt: new Date(),
  };

  await Interview.updateOne({ _id: interviewId }, { $set: { [`coaching.${topicId}`]: result } });
  return result;
}
