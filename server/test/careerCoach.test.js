import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunkInterview } from '../src/services/careerCoach.service.js';

const interview = {
  roleTitle: 'Backend Developer',
  difficultyLabel: 'Standard',
  completedAt: new Date('2026-09-29T10:00:00Z'),
  plan: {
    topics: [
      { id: 't1', title: 'Caching', kind: 'technical' },
      { id: 't2', title: 'Never reached', kind: 'behavioral' },
    ],
  },
  turns: [
    { speaker: 'interviewer', topicId: 't1', question: 'How did you use Redis?' },
    {
      speaker: 'candidate',
      topicId: 't1',
      inputMode: 'text',
      text: 'I cached listings with a TTL.',
      evaluation: { summary: 'Solid basics.', criteria: [{ criterion: 'Explains invalidation', dimension: 'technical_depth', score: 3 }] },
    },
  ],
  coding: {
    problem: { title: 'Two Sum' },
    submission: { language: 'javascript', results: { passed: 7, total: 8 }, review: { summary: 'Clean.', timeComplexity: 'O(n)', issues: [] } },
  },
  report: {
    overall: 64,
    headline: 'Good foundations.',
    summary: 'You explained caching well.',
    dimensions: { technical_depth: 50 },
    topicScores: [{ topicId: 't1', score: 50 }],
    strengths: [{ point: 'Clear' }],
    improvements: [{ point: 'Depth', howToImprove: 'Practise trade-offs' }],
    studyPlan: [{ topic: 'Caching patterns' }],
  },
};

test('builds one chunk per answered topic, plus coding and report chunks', () => {
  const chunks = chunkInterview(interview);
  assert.deepEqual(chunks.map((chunk) => chunk.kind), ['topic', 'coding', 'report']);
  const [topic, coding, report] = chunks;
  assert.match(topic.label, /Backend Developer \(Standard\) interview on 2026-09-29 - Caching/);
  assert.match(topic.text, /Candidate answered: I cached listings with a TTL\./);
  assert.match(topic.text, /Score: 50\/100/);
  assert.match(coding.text, /7\/8 tests passed/);
  assert.match(report.text, /Overall 64\/100/);
});

test('skips topics without answers and caps chunk length', () => {
  const long = { ...interview, turns: [interview.turns[0], { ...interview.turns[1], text: 'x'.repeat(5000) }] };
  const chunks = chunkInterview(long);
  assert.equal(chunks.filter((chunk) => chunk.kind === 'topic').length, 1);
  assert.ok(chunks[0].text.length <= 1603);
});
