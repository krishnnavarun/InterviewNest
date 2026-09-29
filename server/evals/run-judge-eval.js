// Measures how closely the AI grader agrees with human-labelled answers.
//
//   npm run eval:judge                      # default: thinking off, 8 requests/min
//   npm run eval:judge -- --thinking low    # compare reasoning budgets
//   npm run eval:judge -- --rpm 60          # paid tier: run faster
//
// It uses exactly the same prompt, schema and post-processing (evidence
// grounding + score caps) as the live interview.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from '../src/config/env.js';
import { generateJSON } from '../src/ai/gemini.js';
import { TurnSchema } from '../src/ai/schemas.js';
import { interviewTurnPrompt } from '../src/ai/prompts.js';
import { sanitizeEvaluation } from '../src/lib/grounding.js';
import { getRole } from '../src/config/interview.constants.js';
import { EVALS_DIR, fmt, mean, parseArgs, pearson, percentile, saveResults, spearman, throttled } from './lib.js';

const args = parseArgs({ thinking: 'off', rpm: 8, limit: 0, only: '' });
const dataset = JSON.parse(readFileSync(join(EVALS_DIR, 'data', 'judge-dataset.json'), 'utf8'));
const selected = args.only ? dataset.cases.filter((c) => args.only.split(',').includes(c.id)) : dataset.cases;
const cases = args.limit ? selected.slice(0, args.limit) : selected;

const NEXT_TOPIC = { title: 'Coding exercise', kind: 'coding', openingQuestion: 'Let us do a short coding exercise.' };

async function gradeCase(testCase) {
  const def = dataset.topics[testCase.topic];
  const topic = { ...def, id: 't2', maxFollowUps: 2 };
  const interview = {
    roleTitle: getRole(def.role).title,
    difficultyLabel: 'Standard',
    plan: { topics: [{ id: 't1', title: 'Introduction' }, topic, { id: 't3', ...NEXT_TOPIC }] },
  };
  const topicTurns = [
    { speaker: 'interviewer', text: '', question: def.openingQuestion },
    { speaker: 'candidate', text: testCase.answer },
  ];

  const { data, meta } = await generateJSON({
    feature: 'eval_judge',
    ...interviewTurnPrompt({ interview, topic, topicIndex: 1, nextTopic: NEXT_TOPIC, followUpsUsed: 0, topicTurns, coveredTitles: ['Introduction'] }),
    schema: TurnSchema,
    temperature: 0.5,
    thinking: args.thinking,
  });

  const sanitized = sanitizeEvaluation(data.evaluation, topic.rubric, testCase.answer);
  return {
    id: testCase.id,
    human: testCase.humanScore,
    raw: mean(data.evaluation.criteria.map((criterion) => criterion.score)),
    model: mean(sanitized.criteria.map((criterion) => criterion.score)),
    adversarial: testCase.tags?.includes('adversarial') ?? false,
    manipulationFlagged: sanitized.manipulationAttempt,
    quotes: sanitized.criteria.filter((criterion) => criterion.evidence).length,
    rejectedQuotes: sanitized.criteria.filter((criterion) => criterion.evidenceRejected).length,
    rejected: data.evaluation.criteria.filter((c, i) => sanitized.criteria[i]?.evidenceRejected).map((c) => c.evidence),
    action: data.decision.action,
    latencyMs: meta.latencyMs,
  };
}

// A decision is "sensible" if weak answers are not probed deeper and strong
// answers do not get a hint.
const sensibleDecision = (row) =>
  !(row.human <= 2 && row.action === 'probe_deeper') && !(row.human >= 4.5 && row.action === 'give_hint');

console.log(`Judge eval: ${cases.length} cases, model ${env.GEMINI_MODEL}, thinking=${args.thinking}, ${args.rpm} req/min\n`);
const results = await throttled(cases, args.rpm, gradeCase, (done, total) => process.stdout.write(`\r  graded ${done}/${total}`));
console.log('\n');

const rows = results.filter((row) => !row.error);
const errors = results.filter((row) => row.error);
const humans = rows.map((row) => row.human);
const models = rows.map((row) => row.model);
const adversarial = rows.filter((row) => row.adversarial);

const summary = {
  model: env.GEMINI_MODEL,
  thinking: args.thinking,
  cases: cases.length,
  graded: rows.length,
  errors: errors.length,
  maeAfterGuards: mean(rows.map((row) => Math.abs(row.model - row.human))),
  maeRaw: mean(rows.map((row) => Math.abs(row.raw - row.human))),
  withinOne: mean(rows.map((row) => (Math.abs(row.model - row.human) <= 1 ? 1 : 0))),
  pearson: pearson(humans, models),
  spearman: spearman(humans, models),
  injectionDetection: adversarial.length ? mean(adversarial.map((row) => (row.manipulationFlagged ? 1 : 0))) : NaN,
  adversarialMae: mean(adversarial.map((row) => Math.abs(row.model - row.human))),
  quotes: rows.reduce((sum, row) => sum + row.quotes, 0),
  rejectedQuotes: rows.reduce((sum, row) => sum + row.rejectedQuotes, 0),
  sensibleDecisions: mean(rows.map((row) => (sensibleDecision(row) ? 1 : 0))),
  latencyP50: percentile(rows.map((row) => row.latencyMs), 50),
  latencyP95: percentile(rows.map((row) => row.latencyMs), 95),
};

const markdown = [
  `# AI grader evaluation`,
  ``,
  `- Date: ${new Date().toISOString()}`,
  `- Model: \`${summary.model}\`, thinking: \`${summary.thinking}\``,
  `- Cases graded: ${summary.graded}/${summary.cases}${summary.errors ? ` (${summary.errors} errors)` : ''}`,
  ``,
  `| Metric | Value |`,
  `|---|---|`,
  `| Mean absolute error vs human (1-5 scale) | ${fmt(summary.maeAfterGuards)} |`,
  `| MAE before grounding guardrails | ${fmt(summary.maeRaw)} |`,
  `| Within ±1 point of human | ${fmt(summary.withinOne * 100, 0)}% |`,
  `| Pearson / Spearman correlation | ${fmt(summary.pearson)} / ${fmt(summary.spearman)} |`,
  `| Prompt-injection attempts flagged | ${fmt(summary.injectionDetection * 100, 0)}% |`,
  `| MAE on adversarial answers | ${fmt(summary.adversarialMae)} |`,
  `| Evidence quotes verified / rejected | ${summary.quotes} / ${summary.rejectedQuotes} |`,
  `| Sensible next-action decisions | ${fmt(summary.sensibleDecisions * 100, 0)}% |`,
  `| Latency p50 / p95 | ${fmt(summary.latencyP50 / 1000, 1)}s / ${fmt(summary.latencyP95 / 1000, 1)}s |`,
  ``,
  `## Per case`,
  ``,
  `| Case | Human | Model | Raw | Action | Flagged | Latency |`,
  `|---|---|---|---|---|---|---|`,
  ...rows.map(
    (row) =>
      `| ${row.id} | ${row.human} | ${fmt(row.model)} | ${fmt(row.raw)} | ${row.action} | ${row.manipulationFlagged ? 'yes' : ''} | ${fmt(row.latencyMs / 1000, 1)}s |`
  ),
  ...(errors.length ? ['', '## Errors', '', ...errors.map((row) => `- ${row.item.id}: ${row.error}`)] : []),
  '',
].join('\n');

// Subset runs (--only / --limit) never overwrite the full-run "latest" report.
const subset = Boolean(args.only || args.limit);
const file = saveResults(`judge-${args.thinking}${subset ? "-subset" : ""}`, markdown, { summary, rows, errors });
console.log(markdown);
console.log(`Saved to ${file}`);
