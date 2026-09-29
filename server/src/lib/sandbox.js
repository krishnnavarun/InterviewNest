// Runs a MODEL-GENERATED reference solution against test inputs so we can
// verify the model's own expected outputs before showing tests to a candidate.
//
// Trust model: only code written by our LLM runs here - candidate code never
// runs on the server (it runs in the candidate's browser). Even so, the code is
// isolated in layers:
//   - a separate worker thread with capped heap memory and an empty env,
//   - a fresh vm context that has no access to require, process or host objects,
//   - only strings cross the boundary (JSON in, JSON out),
//   - a per-call CPU timeout plus a hard wall-clock kill switch.
import { Worker } from 'node:worker_threads';

const WORKER_SOURCE = `
const { parentPort, workerData } = process.getBuiltinModule('node:worker_threads');
const vm = process.getBuiltinModule('node:vm');
const { code, functionName, argsList, perCallTimeoutMs } = workerData;

const results = [];
try {
  const context = vm.createContext(Object.create(null), {
    codeGeneration: { strings: false, wasm: false },
    microtaskMode: 'afterEvaluate',
  });
  vm.runInContext(code, context, { timeout: perCallTimeoutMs });
  const harness = vm.runInContext(
    '(function (argsJson) {' +
    '  try {' +
    '    var fn = typeof ' + functionName + ' === "function" ? ' + functionName + ' : null;' +
    '    if (!fn) return JSON.stringify({ ok: false, error: "function ' + functionName + ' is not defined" });' +
    '    var value = fn.apply(null, JSON.parse(argsJson));' +
    '    return JSON.stringify({ ok: true, value: value === undefined ? null : value });' +
    '  } catch (e) { return JSON.stringify({ ok: false, error: String(e && e.message || e) }); }' +
    '})',
    context
  );
  for (const argsJson of argsList) {
    context.__args = argsJson;
    try {
      results.push(String(vm.runInContext('__harness(__args)', Object.assign(context, { __harness: harness }), { timeout: perCallTimeoutMs })));
    } catch (error) {
      results.push(JSON.stringify({ ok: false, error: /timed out/i.test(error.message) ? 'Timed out' : String(error.message) }));
    }
  }
  parentPort.postMessage({ results });
} catch (error) {
  parentPort.postMessage({ fatal: String(error.message) });
}
`;

/**
 * @param {{ code: string, functionName: string, argsList: string[], perCallTimeoutMs?: number, totalTimeoutMs?: number }} input
 * @returns {Promise<{ ok: boolean, value?: any, error?: string }[]>}
 */
export function runReferenceSolution({ code, functionName, argsList, perCallTimeoutMs = 1000, totalTimeoutMs = 8000 }) {
  if (!/^[A-Za-z_$][\w$]*$/.test(functionName)) {
    return Promise.resolve(argsList.map(() => ({ ok: false, error: 'invalid function name' })));
  }

  return new Promise((resolve) => {
    const worker = new Worker(WORKER_SOURCE, {
      eval: true,
      env: {},
      workerData: { code, functionName, argsList, perCallTimeoutMs },
      resourceLimits: { maxOldGenerationSizeMb: 64, maxYoungGenerationSizeMb: 16, codeRangeSizeMb: 16 },
    });

    const fail = (message) => resolve(argsList.map(() => ({ ok: false, error: message })));
    const killTimer = setTimeout(() => {
      worker.terminate();
      fail('Timed out');
    }, totalTimeoutMs);

    worker.once('message', (message) => {
      clearTimeout(killTimer);
      worker.terminate();
      if (message.fatal) return fail(message.fatal);
      resolve(message.results.map((json) => JSON.parse(json)));
    });
    worker.once('error', (error) => {
      clearTimeout(killTimer);
      fail(error.message);
    });
  });
}
