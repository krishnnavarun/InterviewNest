import { generateJSON } from '../ai/gemini.js';
import { ReportNarrativeSchema } from '../ai/schemas.js';
import { reportPrompt } from '../ai/prompts.js';
import { computeScores, hiringSignal } from '../lib/scoring.js';
import { aggregateSpeechMetrics } from '../lib/speechMetrics.js';

/** Latest (cumulative) evaluation per topic. */
export function latestTopicEvaluations(turns) {
  const byTopic = {};
  for (const turn of turns) {
    if (turn.speaker === 'candidate' && turn.evaluation) byTopic[turn.topicId] = turn.evaluation;
  }
  return byTopic;
}

export function hasGradableWork(interview) {
  return (
    interview.turns.some((turn) => turn.speaker === 'candidate' && turn.evaluation) ||
    Boolean(interview.coding?.submission)
  );
}

export async function buildReport(interview, context) {
  const topics = interview.plan.topics;
  const topicEvaluations = latestTopicEvaluations(interview.turns);
  const submission = interview.coding?.submission ?? null;

  const scores = computeScores({
    topics,
    topicEvaluations,
    coding: submission ? { passed: submission.results.passed, total: submission.results.total, review: submission.review } : null,
  });

  const speech = aggregateSpeechMetrics(
    interview.turns.filter((turn) => turn.speaker === 'candidate' && turn.inputMode === 'voice').map((turn) => turn.speech)
  );

  const covered = topics.filter((topic) => topicEvaluations[topic.id] || (topic.kind === 'coding' && submission));
  const partial = covered.length < topics.length;

  // How many evidence quotes survived the grounding check (across every graded answer).
  const allCriteria = interview.turns
    .filter((turn) => turn.speaker === 'candidate' && turn.evaluation)
    .flatMap((turn) => turn.evaluation.criteria);
  const grounding = {
    verifiedQuotes: allCriteria.filter((criterion) => criterion.evidence).length,
    rejectedQuotes: allCriteria.filter((criterion) => criterion.evidenceRejected).length,
    cappedScores: allCriteria.filter((criterion) => criterion.notes?.includes('capped_no_evidence')).length,
  };

  const topicSummaries = covered
    .filter((topic) => topicEvaluations[topic.id])
    .map((topic) => {
      const evaluation = topicEvaluations[topic.id];
      return {
        topic: topic.title,
        kind: topic.kind,
        score: scores.topics.find((entry) => entry.topicId === topic.id)?.score,
        summary: evaluation.summary,
        criteria: evaluation.criteria.map(({ criterion, dimension, score, evidence }) => ({ criterion, dimension, score, evidence })),
      };
    });

  const codingSummary = submission
    ? {
        problem: interview.coding.problem.title,
        language: submission.language,
        testsPassed: `${submission.results.passed}/${submission.results.total}`,
        timeComplexity: submission.review?.timeComplexity,
        optimalComplexity: interview.coding.problem.optimalComplexity,
        reviewSummary: submission.review?.summary,
        issues: submission.review?.issues,
      }
    : null;

  const { data: narrative } = await generateJSON({
    feature: 'report',
    ...reportPrompt({
      roleTitle: interview.roleTitle,
      difficultyLabel: interview.difficultyLabel,
      scores,
      topicSummaries,
      coding: codingSummary,
      speech,
      partial,
    }),
    schema: ReportNarrativeSchema,
    temperature: 0.4,
    thinking: 'low',
    timeoutMs: 40000,
    context,
  });

  return {
    ...narrative,
    overall: scores.overall,
    // A verdict needs evidence: with under half the topics covered, don't pretend to have one.
    hiringSignal: covered.length / topics.length < 0.5 ? 'incomplete' : hiringSignal(scores.overall),
    dimensions: scores.dimensions,
    topicScores: scores.topics,
    speech,
    coding: codingSummary,
    partial,
    coverage: { covered: covered.length, total: topics.length },
    grounding,
    generatedAt: new Date(),
  };
}
