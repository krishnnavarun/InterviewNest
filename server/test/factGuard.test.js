import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findUnsupportedSentences, guardNumbers } from '../src/lib/factGuard.js';
import { cosineSimilarity, topK } from '../src/lib/vector.js';

const said = 'I added Redis caching that cut p95 latency from 800ms to 120ms for about 20,000 requests a day.';

test('keeps numbers the candidate actually said', () => {
  const { text, replaced } = guardNumbers('Caching cut p95 latency from 800ms to 120ms across 20,000 daily requests.', said);
  assert.equal(replaced.length, 0);
  assert.match(text, /800ms/);
});

test('replaces invented numbers with a placeholder', () => {
  const { text, replaced } = guardNumbers('This saved 40% of infrastructure cost and served 2 million users.', said);
  assert.deepEqual(replaced, ['40%', '2 million']);
  assert.equal(text, 'This saved [metric] of infrastructure cost and served [metric] users.');
});

test('treats 20k, 20,000 and 20 thousand as the same number', () => {
  const source = 'It served about 20k requests a day and cut latency to 120ms.';
  assert.equal(guardNumbers('It handled 20,000 daily requests.', source).replaced.length, 0);
  assert.equal(guardNumbers('It handled 20 thousand daily requests.', source).replaced.length, 0);
  assert.equal(guardNumbers('Latency dropped to 120 ms.', source).replaced.length, 0);
  assert.deepEqual(guardNumbers('It handled 25k requests.', source).replaced, ['25k']);
});

test('cosine similarity and top-k retrieval', () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  const items = [
    { id: 'a', embedding: [1, 0, 0] },
    { id: 'b', embedding: [0.9, 0.1, 0] },
    { id: 'c', embedding: [0, 0, 1] },
  ];
  const result = topK([1, 0, 0], items, 2);
  assert.deepEqual(result.map((entry) => entry.item.id), ['a', 'b']);
  assert.equal(topK([1, 0, 0], items, 5, 0.5).length, 2);
});

test('flags rewritten sentences the candidate never said', () => {
  const answer =
    "It's a React frontend talking to an Express API with MongoDB. I chose Gemini because the free tier was enough and structured output made grading reliable.";
  const rewrite =
    'I built a React frontend talking to an Express API backed by MongoDB. ' +
    'I chose Gemini because its structured output made grading reliable and the free tier was enough. ' +
    'While PostgreSQL could have offered stronger consistency guarantees, I prioritized flexible document modeling to accelerate iteration. ' +
    'A trade-off I weighed was [the alternative you considered and why you rejected it].';
  const flagged = findUnsupportedSentences(rewrite, answer);
  assert.equal(flagged.length, 1);
  assert.match(flagged[0], /PostgreSQL/);
});

test('sentence splitter keeps dotted names like Node.js intact', async () => {
  const { splitSentences } = await import('../src/lib/factGuard.js');
  const parts = splitSentences('I used Node.js and Express. It was fast! Done').map((s) => s.trim());
  assert.deepEqual(parts, ['I used Node.js and Express.', 'It was fast!', 'Done']);
});
