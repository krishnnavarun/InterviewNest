import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateSpeechMetrics, computeSpeechMetrics, paceLabel } from '../src/lib/speechMetrics.js';

// Builds evenly spaced words: each word lasts 300ms with `gapMs` of silence after it.
const words = (texts, gapMs = 100) => {
  let t = 0;
  return texts.map((text) => {
    const word = { text, start: t, end: t + 300 };
    t += 300 + gapMs;
    return word;
  });
};

test('returns null when there are no words', () => {
  assert.equal(computeSpeechMetrics([]), null);
  assert.equal(computeSpeechMetrics(undefined), null);
});

test('counts filler words and phrases, ignoring punctuation and case', () => {
  const metrics = computeSpeechMetrics(words(['Um,', 'I', 'think', 'uh', 'you', 'know', 'React', 'is', 'UM.']));
  assert.equal(metrics.fillerBreakdown.um, 2);
  assert.equal(metrics.fillerBreakdown.uh, 1);
  assert.equal(metrics.fillerBreakdown['you know'], 1);
  assert.equal(metrics.fillerCount, 4);
});

test('computes words per minute from the speaking duration', () => {
  // 150 words, 400ms apart -> last word ends at 149*400+300 = 59.9s -> ~150 wpm
  const metrics = computeSpeechMetrics(words(Array.from({ length: 150 }, () => 'word')));
  assert.ok(Math.abs(metrics.wpm - 150) <= 1, `wpm was ${metrics.wpm}`);
});

test('detects long pauses', () => {
  const list = [
    { text: 'first', start: 0, end: 300 },
    { text: 'second', start: 2600, end: 2900 }, // 2.3s gap
    { text: 'third', start: 3000, end: 3300 },
  ];
  const metrics = computeSpeechMetrics(list);
  assert.equal(metrics.longPauseCount, 1);
  assert.equal(metrics.longestPauseSec, 2.3);
});

test('aggregates metrics across answers weighted by duration', () => {
  const a = computeSpeechMetrics(words(Array.from({ length: 60 }, () => 'a')));
  const b = computeSpeechMetrics(words(['um', ...Array.from({ length: 59 }, () => 'b')]));
  const total = aggregateSpeechMetrics([a, null, b]);
  assert.equal(total.answers, 2);
  assert.equal(total.fillerCount, 1);
  assert.deepEqual(total.topFillers, [{ word: 'um', count: 1 }]);
  assert.equal(aggregateSpeechMetrics([null]), null);
});

test('labels speaking pace', () => {
  assert.equal(paceLabel(90), 'slow');
  assert.equal(paceLabel(140), 'comfortable');
  assert.equal(paceLabel(190), 'fast');
});
