// Coding round: AI-generated problems whose test cases are VERIFIED by
// executing the model's own reference solution, and code reviews grounded in
// real test results.
import { generateJSON } from '../ai/gemini.js';
import { CodeReviewSchema, CodingProblemSchema } from '../ai/schemas.js';
import { codeReviewPrompt, codingProblemPrompt } from '../ai/prompts.js';
import { runReferenceSolution } from '../lib/sandbox.js';
import { jsonEqual, safeJsonParse } from '../lib/compare.js';
import { AppError } from '../lib/AppError.js';

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PYTHON_KEYWORDS = new Set(['and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield', 'None', 'True', 'False']);
const MIN_VERIFIED_TESTS = 5;
const MAX_ATTEMPTS = 2;

const isArrayType = (type) => /\[\]$|^array/i.test(String(type).trim());

/**
 * Models often forget to wrap a lone argument in the args list, writing
 * ["a","b"] for f(["a","b"]) instead of [["a","b"]]. With one parameter the
 * intent is unambiguous, so wrap it rather than lose the test case.
 */
export function normalizeArgs(args, params) {
  if (params.length !== 1) return args;
  if (!Array.isArray(args)) return [args];
  if (args.length !== 1) return [args];
  return isArrayType(params[0].type) && !Array.isArray(args[0]) ? [args] : args;
}

/** Parse "args"/"expected" JSON strings into a canonical form; null if invalid. */
export function parseCase(testCase, params) {
  const parsed = safeJsonParse(testCase.args);
  const expected = safeJsonParse(testCase.expected);
  if (parsed === undefined || expected === undefined) return null;
  const args = normalizeArgs(parsed, params);
  if (!Array.isArray(args)) return null;
  return { ...testCase, args: JSON.stringify(args), expected: JSON.stringify(expected) };
}

/**
 * Run the reference solution on every example/test and keep only the cases
 * where the model's expected output matches what its own solution returns.
 */
export async function verifyProblem(raw) {
  if (!IDENTIFIER.test(raw.functionName) || !raw.params.every((param) => IDENTIFIER.test(param.name))) {
    return { problem: null, generated: raw.tests.length, kept: 0 };
  }
  const params = raw.params.map((param) => ({
    ...param,
    name: PYTHON_KEYWORDS.has(param.name) ? `${param.name}_` : param.name,
  }));

  const examples = raw.examples.map((testCase) => parseCase(testCase, params)).filter(Boolean);
  const tests = raw.tests.map((testCase) => parseCase(testCase, params)).filter(Boolean);
  const all = [...examples, ...tests];

  const outputs = await runReferenceSolution({
    code: raw.referenceSolution,
    functionName: raw.functionName,
    argsList: all.map((testCase) => testCase.args),
  });

  const matches = (testCase, index) =>
    outputs[index]?.ok && jsonEqual(outputs[index].value, JSON.parse(testCase.expected));
  const keptExamples = examples.filter((testCase, index) => matches(testCase, index));
  const keptTests = tests.filter((testCase, index) => matches(testCase, examples.length + index));

  return {
    problem: { ...raw, params, examples: keptExamples, tests: keptTests },
    generated: examples.length + tests.length,
    kept: keptExamples.length + keptTests.length,
  };
}

export async function generateVerifiedProblem({ role, difficulty, avoidTitles, context }) {
  let best = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { data } = await generateJSON({
      feature: 'coding_problem',
      ...codingProblemPrompt({ role, difficulty, avoidTitles }),
      schema: CodingProblemSchema,
      temperature: 0.9,
      thinking: 'low',
      timeoutMs: 60000, // usually generated in the background
      deadlineMs: 150000,
      context,
    });
    const result = await verifyProblem(data);
    if (!result.problem) continue;

    const verification = { generated: result.generated, kept: result.kept, attempts: attempt };
    const candidate = { problem: result.problem, verification };
    if (!best || result.problem.tests.length > best.problem.tests.length) best = candidate;
    if (result.problem.tests.length >= MIN_VERIFIED_TESTS && result.problem.examples.length >= 1) return candidate;
  }

  if (best && best.problem.tests.length >= 3 && best.problem.examples.length >= 1) return best;
  throw new AppError(502, 'Could not prepare a reliable coding exercise. Please try again.');
}

export function starterCode(problem) {
  const names = problem.params.map((param) => param.name).join(', ');
  const jsDoc = problem.params.map((param) => ` * @param {${param.type}} ${param.name}`).join('\n');
  return {
    javascript: `/**\n${jsDoc}\n * @return {${problem.returnType}}\n */\nfunction ${problem.functionName}(${names}) {\n  // Write your solution here\n\n}\n`,
    python: `def ${problem.functionName}(${names}):\n    # Write your solution here\n    pass\n`,
  };
}

/** What the browser needs to run tests. The reference solution never leaves the server. */
export function publicProblem(problem) {
  return {
    title: problem.title,
    statement: problem.statement,
    functionName: problem.functionName,
    params: problem.params,
    returnType: problem.returnType,
    examples: problem.examples,
    tests: problem.tests.map(({ args, expected }) => ({ args, expected })),
    starterCode: starterCode(problem),
  };
}

/**
 * Grade outputs reported by the browser runner. The server recomputes
 * pass/fail itself from the raw outputs instead of trusting a "passed" flag.
 * @param {object} problem
 * @param {{ actual?: string|null, error?: string|null }[]} outputs  one per example+test, in order
 */
export function gradeOutputs(problem, outputs) {
  const cases = [
    ...problem.examples.map((testCase) => ({ ...testCase, hidden: false })),
    ...problem.tests.map((testCase) => ({ ...testCase, hidden: true })),
  ].map((testCase, index) => {
    const output = outputs[index] ?? {};
    const actualValue = output.error ? undefined : safeJsonParse(output.actual ?? 'null');
    const passed = !output.error && actualValue !== undefined && jsonEqual(actualValue, JSON.parse(testCase.expected));
    return {
      args: testCase.args,
      expected: testCase.expected,
      actual: output.error ? null : output.actual ?? 'null',
      error: output.error ?? null,
      passed,
      hidden: testCase.hidden,
    };
  });
  return { passed: cases.filter((testCase) => testCase.passed).length, total: cases.length, cases };
}

export async function reviewSubmission({ roleTitle, problem, language, code, results, context }) {
  const { data } = await generateJSON({
    feature: 'code_review',
    ...codeReviewPrompt({ roleTitle, problem, language, code, results }),
    schema: CodeReviewSchema,
    temperature: 0.3,
    thinking: 'low',
    timeoutMs: 25000,
    context,
  });
  return data;
}
