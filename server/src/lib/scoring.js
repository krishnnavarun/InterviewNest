// Deterministic score aggregation.
//
// The LLM only grades individual rubric criteria (1-5) with evidence. All
// numbers shown to the user are computed here, so the same evaluations always
// produce the same report - no "vibe" scores from a single LLM call.
import { DIMENSIONS } from '../config/interview.constants.js';

/** Map a 1-5 rubric score to 0-100. */
export const toPercent = (score) => Math.round(((score - 1) / 4) * 100);

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

/** Score for one topic from its final (cumulative) evaluation. */
export function topicScore(evaluation) {
  if (!evaluation?.criteria?.length) return null;
  return toPercent(mean(evaluation.criteria.map((criterion) => criterion.score)));
}

/** Coding score: executed tests weigh as much as the code review. */
export function codingScore({ passed, total, review }) {
  if (!total) return null;
  const testPart = (passed / total) * 100;
  if (!review) return Math.round(testPart);
  const reviewPart = toPercent(mean([review.correctness, review.efficiency, review.codeQuality]));
  return Math.round(0.6 * testPart + 0.4 * reviewPart);
}

/**
 * @param {object} input
 * @param {{ id: string, title: string }[]} input.topics
 * @param {Record<string, object>} input.topicEvaluations  topicId -> sanitized evaluation
 * @param {{ passed: number, total: number, review?: object } | null} input.coding
 * @returns {{ overall: number, dimensions: Record<string, number>, topics: {topicId: string, title: string, score: number}[] }}
 */
export function computeScores({ topics, topicEvaluations, coding }) {
  const buckets = {};
  const add = (dimension, value, weight = 1) => {
    buckets[dimension] ??= { total: 0, weight: 0 };
    buckets[dimension].total += value * weight;
    buckets[dimension].weight += weight;
  };

  const topicScores = [];
  for (const topic of topics) {
    const evaluation = topicEvaluations[topic.id];
    const score = topicScore(evaluation);
    if (score === null) continue;
    topicScores.push({ topicId: topic.id, title: topic.title, score });
    for (const criterion of evaluation.criteria) add(criterion.dimension, toPercent(criterion.score));
  }

  const executed = coding ? codingScore(coding) : null;
  if (executed !== null) add('coding', executed, 2); // executed evidence counts double

  const dimensions = {};
  for (const [dimension, bucket] of Object.entries(buckets)) {
    dimensions[dimension] = Math.round(bucket.total / bucket.weight);
  }

  const present = Object.keys(dimensions);
  const weightSum = present.reduce((sum, dimension) => sum + DIMENSIONS[dimension].weight, 0);
  const overall = weightSum
    ? Math.round(present.reduce((sum, dimension) => sum + dimensions[dimension] * DIMENSIONS[dimension].weight, 0) / weightSum)
    : 0;

  return { overall, dimensions, topics: topicScores };
}

export function hiringSignal(overall) {
  if (overall >= 80) return 'strong_hire';
  if (overall >= 68) return 'hire';
  if (overall >= 55) return 'lean_hire';
  if (overall >= 40) return 'lean_no_hire';
  return 'no_hire';
}
