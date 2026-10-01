// Runs candidate JavaScript in a Web Worker: off the main thread, no DOM
// access, and the page terminates the worker if it runs too long.
const format = (value) => {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

self.onmessage = (event) => {
  const { code, functionName, cases } = event.data;
  const logs = [];
  const consoleProxy = {};
  for (const method of ['log', 'info', 'warn', 'error', 'debug']) {
    consoleProxy[method] = (...args) => {
      if (logs.length < 50) logs.push(args.map(format).join(' '));
    };
  }

  let fn;
  try {
    fn = new Function('console', `"use strict";\n${code}\n;return typeof ${functionName} === "function" ? ${functionName} : undefined;`)(consoleProxy);
  } catch (error) {
    self.postMessage({ compileError: `${error.name}: ${error.message}` });
    return;
  }
  if (!fn) {
    self.postMessage({ compileError: `Define a function named ${functionName}.` });
    return;
  }

  const results = cases.map((testCase) => {
    logs.length = 0;
    const started = performance.now();
    try {
      const value = fn(...JSON.parse(testCase.args));
      return {
        actual: JSON.stringify(value === undefined ? null : value),
        error: null,
        ms: Math.round((performance.now() - started) * 100) / 100,
        logs: [...logs],
      };
    } catch (error) {
      return { actual: null, error: `${error?.name ?? 'Error'}: ${error?.message ?? error}`, ms: 0, logs: [...logs] };
    }
  });

  self.postMessage({ results });
};
