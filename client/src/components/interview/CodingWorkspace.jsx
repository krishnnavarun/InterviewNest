import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { CheckCircle2, EyeOff, FlaskConical, Play, RotateCcw, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { checkResult, preloadPython, runCode } from '@/lib/codeRunner';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
];

const pretty = (json) => {
  try {
    return JSON.stringify(JSON.parse(json));
  } catch {
    return json;
  }
};
const formatArgs = (argsJson) => {
  try {
    return JSON.parse(argsJson)
      .map((arg) => JSON.stringify(arg))
      .join(', ');
  } catch {
    return argsJson;
  }
};

function defineTheme(monaco) {
  monaco.editor.defineTheme('interviewnest', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#0f0b15',
      'editor.lineHighlightBackground': '#1b1424',
      'editorLineNumber.foreground': '#4a4058',
      'editor.selectionBackground': '#6633ee55',
    },
  });
}

function ResultRow({ testCase, result, index }) {
  const passed = checkResult(result, testCase.expected);
  return (
    <li className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-semibold">
          {passed ? <CheckCircle2 className="size-4 text-emerald-300" /> : <XCircle className="size-4 text-red-300" />}
          {testCase.hidden ? `Hidden test ${index + 1}` : `Example ${index + 1}`}
          <span className="sr-only">{passed ? 'passed' : 'failed'}</span>
        </span>
        {typeof result?.ms === 'number' && <span className="text-white/35">{result.ms} ms</span>}
      </div>
      {testCase.hidden ? (
        <p className="mt-1.5 flex items-center gap-1 text-white/40">
          <EyeOff className="size-3" /> Input hidden
        </p>
      ) : (
        <dl className="mt-2 grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-1 font-mono">
          <dt className="text-white/40">input</dt>
          <dd className="break-all text-white/80">{formatArgs(testCase.args)}</dd>
          <dt className="text-white/40">expected</dt>
          <dd className="break-all text-white/80">{pretty(testCase.expected)}</dd>
          <dt className="text-white/40">{result?.error ? 'error' : 'got'}</dt>
          <dd className={cn('break-all', passed ? 'text-emerald-200' : 'text-red-200')}>{result?.error ?? pretty(result?.actual ?? 'null')}</dd>
        </dl>
      )}
      {result?.logs?.length > 0 && !testCase.hidden && (
        <pre className="mt-2 max-h-24 overflow-auto rounded-lg bg-black/30 p-2 font-mono text-[11px] text-white/60">{result.logs.join('\n')}</pre>
      )}
    </li>
  );
}

export function CodingWorkspace({ problem, disabled, onSubmit }) {
  const [language, setLanguage] = useState('javascript');
  const [drafts, setDrafts] = useState(() => ({ ...problem.starterCode }));
  const [running, setRunning] = useState(null); // 'run' | 'submit'
  const [run, setRun] = useState(null); // { cases, results, compileError }
  const [pythonState, setPythonState] = useState('idle');

  const examples = useMemo(() => problem.examples.map((item) => ({ ...item, hidden: false })), [problem]);
  const allCases = useMemo(() => [...examples, ...problem.tests.map((item) => ({ ...item, hidden: true }))], [examples, problem]);

  useEffect(() => {
    if (language !== 'python' || pythonState !== 'idle') return;
    setPythonState('loading');
    preloadPython()
      .then(() => setPythonState('ready'))
      .catch((error) => {
        setPythonState('idle');
        toast.error(error.message);
      });
  }, [language, pythonState]);

  const code = drafts[language];

  const execute = async (cases) => {
    const outcome = await runCode({ language, code, functionName: problem.functionName, cases });
    return { cases, results: outcome.results ?? [], compileError: outcome.compileError ?? null };
  };

  const handleRun = async () => {
    setRunning('run');
    try {
      setRun(await execute(examples));
    } finally {
      setRunning(null);
    }
  };

  const handleSubmit = async () => {
    setRunning('submit');
    try {
      const outcome = await execute(allCases);
      setRun(outcome);
      const outputs = allCases.map((_, index) => {
        if (outcome.compileError) return { actual: null, error: outcome.compileError.slice(0, 1900) };
        const result = outcome.results[index];
        return { actual: result?.actual ?? null, error: result?.error?.slice(0, 1900) ?? null };
      });
      await onSubmit({ language, code, outputs });
    } finally {
      setRunning(null);
    }
  };

  const passedCount = run && !run.compileError ? run.cases.filter((testCase, index) => checkResult(run.results[index], testCase.expected)).length : 0;

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
      <section className="surface-ink min-h-0 overflow-y-auto rounded-2xl p-5 text-white">
        <Badge tone="brand">Coding exercise</Badge>
        <h2 className="mt-3 text-xl font-bold">{problem.title}</h2>
        <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-white/75">{problem.statement}</p>

        <p className="mt-5 text-xs font-semibold tracking-wide text-white/45 uppercase">Signature</p>
        <code className="mt-1.5 block rounded-lg bg-black/30 p-3 font-mono text-xs text-brand-200">
          {problem.functionName}({problem.params.map((param) => `${param.name}: ${param.type}`).join(', ')}) → {problem.returnType}
        </code>

        <p className="mt-5 text-xs font-semibold tracking-wide text-white/45 uppercase">Examples</p>
        <ul className="mt-2 space-y-2.5">
          {problem.examples.map((example, index) => (
            <li key={index} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 font-mono text-xs">
              <p>
                <span className="text-white/40">input </span>
                {formatArgs(example.args)}
              </p>
              <p className="mt-1">
                <span className="text-white/40">output </span>
                {pretty(example.expected)}
              </p>
              {example.explanation && <p className="mt-1.5 font-sans text-white/50">{example.explanation}</p>}
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-white/40">
          <FlaskConical className="size-3.5" /> {problem.tests.length} hidden tests run when you submit.
        </p>
      </section>

      <section className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0b15]">
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] px-3 py-2">
          <div className="flex items-center gap-1">
            {LANGUAGES.map((item) => (
              <button
                key={item.id}
                onClick={() => setLanguage(item.id)}
                disabled={Boolean(running)}
                className={cn(
                  'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  language === item.id ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
                )}
              >
                {item.label}
              </button>
            ))}
            {language === 'python' && pythonState === 'loading' && (
              <span className="ml-2 flex items-center gap-1.5 text-xs text-white/45">
                <Spinner className="size-3" /> Loading Python runtime...
              </span>
            )}
          </div>
          <button
            onClick={() => setDrafts((current) => ({ ...current, [language]: problem.starterCode[language] }))}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-white/50 hover:text-white"
          >
            <RotateCcw className="size-3.5" /> Reset
          </button>
        </div>

        <div className="min-h-[300px] flex-1">
          <Editor
            language={language}
            value={code}
            theme="interviewnest"
            beforeMount={defineTheme}
            onChange={(value) => setDrafts((current) => ({ ...current, [language]: value ?? '' }))}
            loading={<Spinner className="text-white/60" />}
            options={{
              fontSize: 14,
              fontFamily: 'JetBrains Mono, monospace',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              tabSize: language === 'python' ? 4 : 2,
              automaticLayout: true,
              padding: { top: 14 },
            }}
          />
        </div>

        {run && (
          <div className="max-h-64 overflow-y-auto border-t border-white/[0.08] p-3">
            {run.compileError ? (
              <pre className="rounded-lg bg-red-500/10 p-3 font-mono text-xs whitespace-pre-wrap text-red-200">{run.compileError}</pre>
            ) : (
              <>
                <p className="mb-2 text-xs font-semibold text-white/70">
                  {passedCount}/{run.cases.length} passed
                </p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {run.cases.map((testCase, index) => (
                    <ResultRow
                      key={index}
                      testCase={testCase}
                      result={run.results[index]}
                      index={testCase.hidden ? index - examples.length : index}
                    />
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] p-3">
          <Button variant="outline" size="sm" onClick={handleRun} loading={running === 'run'} disabled={disabled || Boolean(running)}>
            {running !== 'run' && <Play className="size-3.5" />} Run examples
          </Button>
          <Button variant="light" size="sm" onClick={handleSubmit} loading={running === 'submit'} disabled={disabled || Boolean(running)}>
            {running !== 'submit' && <Send className="size-3.5" />} Submit solution
          </Button>
        </div>
      </section>
    </div>
  );
}
