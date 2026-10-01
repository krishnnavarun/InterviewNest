// Shapes interview documents for the browser. Grading data (evaluations,
// agent reasoning, rubrics, code review) is hidden until the interview is
// completed - just like a real interviewer does not show you their notes.
import { publicProblem } from './coding.service.js';

export function toTurnView(turn, index, revealGrading) {
  return {
    index,
    speaker: turn.speaker,
    topicId: turn.topicId,
    text: turn.text,
    question: turn.question,
    action: turn.action,
    inputMode: turn.inputMode,
    speech: turn.speech ?? null,
    createdAt: turn.createdAt,
    ...(revealGrading
      ? { evaluation: turn.evaluation ?? null, reasoning: turn.reasoning ?? null, policyOverride: turn.policyOverride ?? null }
      : {}),
  };
}

export function toStateView(interview) {
  return {
    status: interview.status,
    phase: interview.phase,
    currentTopicIndex: interview.currentTopicIndex,
    codingStatus: interview.coding?.status ?? 'none',
  };
}

export function toInterviewView(interview) {
  const done = interview.status === 'completed';
  const coding = interview.coding ?? {};
  const submission = coding.submission;

  return {
    id: interview._id,
    role: interview.role,
    roleTitle: interview.roleTitle,
    difficulty: interview.difficulty,
    difficultyLabel: interview.difficultyLabel,
    voiceEnabled: interview.voiceEnabled,
    createdAt: interview.createdAt,
    completedAt: interview.completedAt ?? null,
    ...toStateView(interview),
    topics: interview.plan.topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      kind: topic.kind,
      ...(done ? { whyThisTopic: topic.whyThisTopic, rubric: topic.rubric } : {}),
    })),
    turns: interview.turns.map((turn, index) => toTurnView(turn, index, done)),
    coding: {
      status: coding.status ?? 'none',
      problem: coding.problem ? publicProblem(coding.problem) : null,
      verification: coding.verification ?? null,
      submission: submission
        ? {
            language: submission.language,
            code: submission.code,
            results: submission.results,
            ...(done ? { review: submission.review } : {}),
          }
        : null,
    },
    gap: interview.gap ?? null,
    weakAreasTargeted: interview.weakAreasTargeted ?? [],
    report: done ? interview.report : null,
    coaching: done ? interview.coaching ?? {} : {},
    overallScore: interview.overallScore ?? null,
    aiStats: interview.aiStats,
  };
}

export function toHistoryItem(interview) {
  return {
    id: interview._id,
    roleTitle: interview.roleTitle,
    difficultyLabel: interview.difficultyLabel,
    status: interview.status,
    overallScore: interview.overallScore ?? null,
    headline: interview.report?.headline ?? null,
    createdAt: interview.createdAt,
    completedAt: interview.completedAt ?? null,
  };
}
