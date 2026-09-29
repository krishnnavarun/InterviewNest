// Runs code against test cases in a Web Worker and enforces a time limit by
// terminating the worker (the only reliable way to stop an infinite loop).

const JS_TIMEOUT_MS = 4000;
const PY_TIMEOUT_MS = 10000;
const PY_LOAD_TIMEOUT_MS = 60000;

const createJsWorker = () => new Worker(new URL('../workers/js-runner.worker.js', import.meta.url));
const createPyWorker = () => new Worker(new URL('../workers/python-runner.worker.js', import.meta.url));

function timeoutResult(cases) {
  return {
    timedOut: true,
    results: cases.map(() => ({ actual: null, error: 'Timed out - check for an infinite loop or a very slow algorithm.', logs: [] })),
  };
}

function runJavaScript({ code, functionName, cases }) {
  return new Promise((resolve) => {
    const worker = createJsWorker();
    const timer = setTimeout(() => {
      worker.terminate();
      resolve(timeoutResult(cases));
    }, JS_TIMEOUT_MS);
    worker.onmessage = (event) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(event.data);
    };
    worker.onerror = (event) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ compileError: event.message || 'Your code could not run.' });
    };
    worker.postMessage({ code, functionName, cases });
  });
}

// Python keeps one warm worker because loading Pyodide takes a few seconds.
let pyWorker = null;
let pyReady = null;

export function preloadPython() {
  if (pyReady) return pyReady;
  pyWorker = createPyWorker();
  pyReady = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('The Python runtime took too long to load.')), PY_LOAD_TIMEOUT_MS);
    pyWorker.addEventListener('message', function onReady(event) {
      if (event.data?.type === 'ready') {
        clearTimeout(timer);
        pyWorker.removeEventListener('message', onReady);
        resolve();
      } else if (event.data?.type === 'load-error') {
        clearTimeout(timer);
        reject(new Error(`Could not load Python: ${event.data.error}`));
      }
    });
  }).catch((error) => {
    resetPython();
    throw error;
  });
  return pyReady;
}

function resetPython() {
  pyWorker?.terminate();
  pyWorker = null;
  pyReady = null;
}

async function runPython({ code, functionName, cases }) {
  try {
    await preloadPython();
  } catch (error) {
    return { compileError: error.message };
  }
  const worker = pyWorker;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resetPython(); // kill the stuck interpreter; the next run reloads it
      resolve(timeoutResult(cases));
    }, PY_TIMEOUT_MS);
    const onMessage = (event) => {
      if (event.data?.type !== 'result') return;
      clearTimeout(timer);
      worker.removeEventListener('message', onMessage);
      resolve(event.data);
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage({ code, functionName, cases });
  });
}

/**
 * @returns {Promise<{ results?: {actual: string|null, error: string|null, ms?: number, logs?: string[]}[], compileError?: string, timedOut?: boolean }>}
 */
export function runCode({ language, code, functionName, cases }) {
  return language === 'python' ? runPython({ code, functionName, cases }) : runJavaScript({ code, functionName, cases });
}

/** Structural JSON equality with float tolerance (mirrors the server). */
export function jsonEqual(actual, expected, tolerance = 1e-6) {
  if (typeof actual === 'number' && typeof expected === 'number') {
    return Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected));
  }
  if (actual === null || expected === null || typeof actual !== 'object' || typeof expected !== 'object') return actual === expected;
  if (Array.isArray(actual) !== Array.isArray(expected)) return false;
  if (Array.isArray(actual)) return actual.length === expected.length && actual.every((item, i) => jsonEqual(item, expected[i], tolerance));
  const keys = Object.keys(expected);
  return keys.length === Object.keys(actual).length && keys.every((key) => Object.hasOwn(actual, key) && jsonEqual(actual[key], expected[key], tolerance));
}

export function checkResult(result, expectedJson) {
  if (!result || result.error || result.actual === null || result.actual === undefined) return false;
  try {
    return jsonEqual(JSON.parse(result.actual), JSON.parse(expectedJson));
  } catch {
    return false;
  }
}
