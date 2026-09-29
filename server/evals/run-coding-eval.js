// Measures how reliable AI-generated coding problems are: what fraction of the
// model's own test cases survive verification against its reference solution.
//
//   npm run eval:coding -- --n 6 --rpm 8
import { env } from '../src/config/env.js';
import { generateJSON } from '../src/ai/gemini.js';
import { CodingProblemSchema } from '../src/ai/schemas.js';
import { codingProblemPrompt } from '../src/ai/prompts.js';
import { verifyProblem } from '../src/services/coding.service.js';
import { DIFFICULTIES, ROLES } from '../src/config/interview.constants.js';
import { fmt, mean, parseArgs, percentile, saveResults, throttled } from './lib.js';

const args = parseArgs({ n: 6, rpm: 8 });
const difficultyIds = Object.keys(DIFFICULTIES);
const jobs = Array.from({ length: args.n }, (_, i) => ({
  role: ROLES[i % ROLES.length],
  difficulty: DIFFICULTIES[difficultyIds[i % difficultyIds.length]],
}));

console.log(`Coding eval: ${jobs.length} problems, model ${env.GEMINI_MODEL}\n`);

const results = await throttled(
  jobs,
  args.rpm,
  async ({ role, difficulty }) => {
    const { data, meta } = await generateJSON({
      feature: 'eval_coding',
      ...codingProblemPrompt({ role, difficulty, avoidTitles: [] }),
      schema: CodingProblemSchema,
      temperature: 0.9,
      thinking: 'low',
      timeoutMs: 90000,
    });
    const verified = await verifyProblem(data);
    return {
      role: role.title,
      difficulty: difficulty.label,
      title: data.title,
      generated: verified.generated,
      kept: verified.kept,
      usable: Boolean(verified.problem && verified.problem.tests.length >= 5 && verified.problem.examples.length >= 1),
      latencyMs: meta.latencyMs,
    };
  },
  (done, total) => process.stdout.write(`\r  generated ${done}/${total}`)
);
console.log('\n');

const rows = results.filter((row) => !row.error);
const errors = results.filter((row) => row.error);
const generated = rows.reduce((sum, row) => sum + row.generated, 0);
const kept = rows.reduce((sum, row) => sum + row.kept, 0);
const summary = {
  model: env.GEMINI_MODEL,
  problems: rows.length,
  errors: errors.length,
  testCasesGenerated: generated,
  testCasesVerified: kept,
  verificationRate: generated ? kept / generated : NaN,
  usableFirstTry: mean(rows.map((row) => (row.usable ? 1 : 0))),
  latencyP50: percentile(rows.map((row) => row.latencyMs), 50),
};

const markdown = [
  '# Coding problem generation evaluation',
  '',
  `- Date: ${new Date().toISOString()}`,
  `- Model: \`${summary.model}\``,
  '',
  '| Metric | Value |',
  '|---|---|',
  `| Problems generated | ${summary.problems}${summary.errors ? ` (${summary.errors} errors)` : ''} |`,
  `| Test cases verified by reference solution | ${kept}/${generated} (${fmt(summary.verificationRate * 100, 0)}%) |`,
  `| Problems usable on first attempt (>=5 verified tests) | ${fmt(summary.usableFirstTry * 100, 0)}% |`,
  `| Generation latency p50 | ${fmt(summary.latencyP50 / 1000, 1)}s |`,
  '',
  '| Role | Difficulty | Problem | Verified tests | Usable |',
  '|---|---|---|---|---|',
  ...rows.map((row) => `| ${row.role} | ${row.difficulty} | ${row.title} | ${row.kept}/${row.generated} | ${row.usable ? 'yes' : 'no'} |`),
  ...(errors.length ? ['', '## Errors', '', ...errors.map((row) => `- ${row.item.role.title}: ${row.error}`)] : []),
  '',
].join('\n');

const file = saveResults('coding', markdown, { summary, rows, errors });
console.log(markdown);
console.log(`Saved to ${file}`);
