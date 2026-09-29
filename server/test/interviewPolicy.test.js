import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveNextAction } from '../src/lib/interviewPolicy.js';

const base = { topicIndex: 1, topicCount: 5, followUpsUsed: 0, maxFollowUps: 2, candidateTurns: 3, turnBudget: 13 };

test('keeps a valid follow-up from the model', () => {
  assert.deepEqual(resolveNextAction({ ...base, proposed: 'follow_up' }), { action: 'follow_up', overridden: false, reason: null });
});

test('forces the next topic once follow-ups are used up', () => {
  const result = resolveNextAction({ ...base, proposed: 'probe_deeper', followUpsUsed: 2 });
  assert.equal(result.action, 'next_topic');
  assert.equal(result.reason, 'follow_up_limit_reached');
});

test('wraps up instead of moving past the last topic', () => {
  assert.equal(resolveNextAction({ ...base, proposed: 'next_topic', topicIndex: 4 }).action, 'wrap_up');
  assert.equal(resolveNextAction({ ...base, proposed: 'give_hint', topicIndex: 4, followUpsUsed: 2 }).action, 'wrap_up');
});

test('does not let the model end the interview early', () => {
  const result = resolveNextAction({ ...base, proposed: 'wrap_up' });
  assert.equal(result.action, 'next_topic');
  assert.equal(result.reason, 'topics_remaining');
});

test('ends the interview when the turn budget is exhausted', () => {
  const result = resolveNextAction({ ...base, proposed: 'follow_up', candidateTurns: 13 });
  assert.equal(result.action, 'wrap_up');
  assert.equal(result.reason, 'turn_budget_reached');
});
