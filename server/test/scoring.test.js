import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codingScore, computeScores, hiringSignal, toPercent, topicScore } from '../src/lib/scoring.js';

const evaluation = (entries) => ({ criteria: entries.map(([dimension, score]) => ({ dimension, score })) });

test('maps rubric scores 1-5 onto 0-100', () => {
  assert.equal(toPercent(1), 0);
  assert.equal(toPercent(3), 50);
  assert.equal(toPercent(5), 100);
  assert.equal(topicScore(evaluation([['communication', 4], ['technical_depth', 2]])), 50);
  assert.equal(topicScore(null), null);
});

test('coding score blends executed tests with the code review', () => {
  assert.equal(codingScore({ passed: 8, total: 8, review: { correctness: 5, efficiency: 5, codeQuality: 5 } }), 100);
  assert.equal(codingScore({ passed: 4, total: 8, review: null }), 50);
  assert.equal(codingScore({ passed: 0, total: 0 }), null);
});

test('aggregates dimensions and a weighted overall score deterministically', () => {
  const topics = [
    { id: 't1', title: 'Intro' },
    { id: 't2', title: 'Deep dive' },
    { id: 't3', title: 'Never reached' },
  ];
  const topicEvaluations = {
    t1: evaluation([['communication', 5], ['ownership', 3]]),
    t2: evaluation([['technical_depth', 3], ['communication', 3]]),
  };
  const first = computeScores({ topics, topicEvaluations, coding: null });
  const second = computeScores({ topics, topicEvaluations, coding: null });
  assert.deepEqual(first, second);

  assert.deepEqual(first.dimensions, { communication: 75, ownership: 50, technical_depth: 50 });
  assert.equal(first.topics.length, 2);
  // (75*0.2 + 50*0.15 + 50*0.25) / 0.6 = 58.33
  assert.equal(first.overall, 58);
});

test('executed coding results count double in the coding dimension', () => {
  const result = computeScores({
    topics: [{ id: 't1', title: 'Coding' }],
    topicEvaluations: { t1: evaluation([['coding', 3]]) },
    coding: { passed: 8, total: 8, review: { correctness: 5, efficiency: 5, codeQuality: 5 } },
  });
  // (50*1 + 100*2) / 3 = 83.3
  assert.equal(result.dimensions.coding, 83);
});

test('maps overall score to a hiring signal', () => {
  assert.equal(hiringSignal(85), 'strong_hire');
  assert.equal(hiringSignal(70), 'hire');
  assert.equal(hiringSignal(56), 'lean_hire');
  assert.equal(hiringSignal(45), 'lean_no_hire');
  assert.equal(hiringSignal(10), 'no_hire');
});
