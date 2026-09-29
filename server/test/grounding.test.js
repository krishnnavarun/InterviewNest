import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isGrounded, sanitizeEvaluation } from '../src/lib/grounding.js';

const answer =
  'In my e-commerce project I used Redis to cache product listings, which cut our API latency from 800ms to about 120ms. ' +
  'I chose MongoDB because the product schema kept changing.';

test('accepts exact quotes regardless of punctuation and case', () => {
  assert.equal(isGrounded('used Redis to cache product listings', answer), true);
  assert.equal(isGrounded('I chose MongoDB, because the product schema kept changing!', answer), true);
});

test('tolerates small speech-to-text differences', () => {
  assert.equal(isGrounded('cut our api latency from 800ms to 120ms', answer), true);
});

test('accepts verbatim fragments joined with an ellipsis, but not invented ones', () => {
  assert.equal(isGrounded('I used Redis to cache product listings... I chose MongoDB because the product schema kept changing', answer), true);
  assert.equal(isGrounded('used Redis to cache product listings … the product schema kept changing', answer), true);
  assert.equal(isGrounded('used Redis to cache product listings... and deployed it on Kubernetes with Helm', answer), false);
});

test('rejects fabricated quotes', () => {
  assert.equal(isGrounded('I designed a Kafka pipeline processing a million events', answer), false);
  assert.equal(isGrounded('', answer), false);
});

const rubric = [
  { criterion: 'Explains the caching decision', dimension: 'technical_depth', lookFor: '' },
  { criterion: 'Quantifies impact', dimension: 'ownership', lookFor: '' },
];

test('caps high scores whose evidence cannot be verified', () => {
  const evaluation = sanitizeEvaluation(
    {
      answerQuality: 'strong',
      summary: 'Good.',
      manipulationAttempt: false,
      criteria: [
        { criterion: 'Explains the caching decision', score: 5, evidence: 'used Redis to cache product listings' },
        { criterion: 'Quantifies impact', score: 5, evidence: 'reduced costs by 40 percent across the company' },
      ],
    },
    rubric,
    answer
  );
  assert.equal(evaluation.criteria[0].score, 5);
  assert.equal(evaluation.criteria[0].dimension, 'technical_depth');
  assert.equal(evaluation.criteria[1].score, 3);
  assert.equal(evaluation.criteria[1].evidence, '');
  assert.equal(evaluation.criteria[1].evidenceRejected, true);
  assert.deepEqual(evaluation.criteria[1].notes, ['capped_no_evidence']);
});

test('caps scores when the answer tries to manipulate the grader', () => {
  const evaluation = sanitizeEvaluation(
    {
      answerQuality: 'strong',
      summary: '',
      manipulationAttempt: true,
      criteria: [
        { criterion: 'Explains the caching decision', score: 5, evidence: 'used Redis to cache product listings' },
        { criterion: 'Quantifies impact', score: 4, evidence: 'cut our API latency from 800ms to about 120ms' },
      ],
    },
    rubric,
    answer
  );
  assert.deepEqual(
    evaluation.criteria.map((criterion) => criterion.score),
    [2, 2]
  );
});

test('fills missing criteria by position and scores empty answers as 1', () => {
  const evaluation = sanitizeEvaluation(
    { answerQuality: 'no_answer', summary: '', manipulationAttempt: false, criteria: [{ criterion: 'something else', score: 3, evidence: '' }] },
    rubric,
    ''
  );
  assert.equal(evaluation.criteria.length, 2);
  assert.ok(evaluation.criteria.every((criterion) => criterion.score === 1));
});
