/* global importScripts, loadPyodide */
// Runs candidate Python in the browser with Pyodide (CPython compiled to
// WebAssembly) inside a Web Worker. Nothing is executed on our server.
const PYODIDE_VERSION = '0.27.7';
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

const HARNESS = `
import json, sys, io, time

def __run_cases(code, fn_name, cases_json):
    namespace = {}
    try:
        exec(code, namespace)
    except Exception as error:
        return json.dumps({"compileError": f"{type(error).__name__}: {error}"})
    fn = namespace.get(fn_name)
    if not callable(fn):
        return json.dumps({"compileError": f"Define a function named {fn_name}."})
    results = []
    for case in json.loads(cases_json):
        buffer, previous = io.StringIO(), sys.stdout
        sys.stdout = buffer
        started = time.perf_counter()
        try:
            value = fn(*json.loads(case["args"]))
            result = {"actual": json.dumps(value), "error": None}
        except Exception as error:
            result = {"actual": None, "error": f"{type(error).__name__}: {error}"}
        finally:
            sys.stdout = previous
        result["ms"] = round((time.perf_counter() - started) * 1000, 2)
        result["logs"] = buffer.getvalue().splitlines()[:50]
        results.append(result)
    return json.dumps({"results": results})
`;

let pyodidePromise = null;

function getPyodide() {
  pyodidePromise ??= (async () => {
    importScripts(`${PYODIDE_URL}pyodide.js`);
    const pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
    pyodide.runPython(HARNESS);
    return pyodide;
  })();
  return pyodidePromise;
}

// Start downloading the runtime as soon as the worker is created.
getPyodide()
  .then(() => self.postMessage({ type: 'ready' }))
  .catch((error) => self.postMessage({ type: 'load-error', error: String(error?.message ?? error) }));

self.onmessage = async (event) => {
  const { code, functionName, cases } = event.data;
  try {
    const pyodide = await getPyodide();
    const run = pyodide.globals.get('__run_cases');
    const output = run(code, functionName, JSON.stringify(cases));
    run.destroy();
    self.postMessage({ type: 'result', ...JSON.parse(output) });
  } catch (error) {
    self.postMessage({ type: 'result', compileError: String(error?.message ?? error) });
  }
};
