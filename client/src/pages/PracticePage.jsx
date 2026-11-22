import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowRight, CheckCircle2, Crosshair, Dumbbell, Lightbulb, ListChecks, Quote, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { PageSkeleton } from '@/components/ui/skeleton';
import { AnimatedNumber, AnimatePresence, EASE, Page, Stagger, StaggerItem, motion } from '@/components/ui/motion';
import { ScorePips } from '@/components/report/ScorePips';
import { drillApi, progressApi } from '@/lib/services';
import { errorMessage } from '@/lib/api';
import { SCORE_TEXT, scoreTone, timeAgo } from '@/lib/format';
import { DIMENSIONS, TOPIC_KIND_LABELS } from '@/constants/interview';
import { cn } from '@/lib/utils';

const DRILL_DIMENSIONS = Object.entries(DIMENSIONS).filter(([id]) => id !== 'coding');

function DrillFeedback({ drill }) {
  const { feedback } = drill;
  return (
    <Stagger className="space-y-5" step={0.08}>
      <StaggerItem className="flex flex-wrap items-center gap-5 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 shadow-xs">
        <div className="text-center">
          <p className={cn('text-5xl font-extrabold tracking-tight', SCORE_TEXT[scoreTone(drill.score)])}>
            <AnimatedNumber value={drill.score} />
          </p>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">out of 100</p>
        </div>
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-zinc-700">{feedback.evaluation.summary}</p>
      </StaggerItem>

      <StaggerItem>
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Rubric Evaluation</p>
        <ul className="space-y-2.5">
          {feedback.evaluation.criteria.map((criterion) => (
            <li key={criterion.criterion} className="rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-950">{criterion.criterion}</p>
                <ScorePips score={criterion.score} />
              </div>
              {criterion.evidence && (
                <p className="mt-2 flex gap-2 text-xs text-zinc-600 italic">
                  <Quote className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  "{criterion.evidence}"
                </p>
              )}
            </li>
          ))}
        </ul>
      </StaggerItem>

      <StaggerItem className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
            <CheckCircle2 className="size-3.5 text-emerald-600" /> What worked
          </p>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-zinc-700">
            {(feedback.strengths.length ? feedback.strengths : ['Not much yet - the outline below shows what to cover.']).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-800">
            <Lightbulb className="size-3.5 text-amber-600" /> Improve next time
          </p>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-zinc-700">
            {feedback.improvements.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </StaggerItem>

      <StaggerItem className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-zinc-700">
          <ListChecks className="size-3.5 text-zinc-500" /> A strong answer covers
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-zinc-700">
          {feedback.strongAnswerOutline.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </StaggerItem>
    </Stagger>
  );
}

export default function PracticePage() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState({ items: [], stats: {} });
  const [weakAreas, setWeakAreas] = useState([]);
  const [dimension, setDimension] = useState('auto');
  const [focus, setFocus] = useState('');
  const [drill, setDrill] = useState(null);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    Promise.all([drillApi.list(), progressApi.get().catch(() => null)])
      .then(([drills, progress]) => {
        setHistory(drills);
        setWeakAreas(progress?.weakAreas ?? []);
        const open = drills.items.find((item) => item.status === 'open');
        if (open) setDrill(open);
      })
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  const createDrill = async () => {
    setBusy('creating');
    try {
      const payload = {};
      if (dimension !== 'auto') payload.dimension = dimension;
      if (focus.trim()) payload.focus = focus.trim();
      const created = await drillApi.create(payload);
      setDrill(created);
      setAnswer('');
      setHistory((current) => ({ ...current, items: [created, ...current.items] }));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const submitAnswer = async () => {
    setBusy('grading');
    try {
      const graded = await drillApi.answer(drill.id, answer);
      setDrill(graded);
      setHistory((current) => ({
        stats: current.stats,
        items: current.items.map((item) => (item.id === graded.id ? graded : item)),
      }));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <PageSkeleton label="Loading practice..." />;

  const weakest = weakAreas[0];
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const answered = history.items.filter((item) => item.status === 'answered');

  return (
    <Page className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Practice</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">Targeted drills</h1>
          <p className="mt-1 text-sm text-zinc-600">One focused question at a time, graded instantly against a rubric.</p>
        </div>
        {answered.length > 0 && (
          <div className="flex gap-3 text-sm text-zinc-700">
            <span className="rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 shadow-xs font-medium">
              <strong className="text-zinc-950 font-bold">{answered.length}</strong> {answered.length === 1 ? 'drill' : 'drills'} done
            </span>
            {history.stats?.averageScore !== null && history.stats?.averageScore !== undefined && (
              <span className="rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 shadow-xs font-medium">
                avg <strong className="text-zinc-950 font-bold">{history.stats.averageScore}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Panel className="h-fit p-5 sm:p-6 shadow-sm">
          <PanelHeader title="New drill" description="Pick a skill to sharpen, or let the AI choose." />
          <div className="mt-5 space-y-2.5" role="radiogroup" aria-label="Skill to practise">
            <button
              role="radio"
              aria-checked={dimension === 'auto'}
              onClick={() => setDimension('auto')}
              className={cn(
                'flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-all',
                dimension === 'auto'
                  ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                  : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900'
              )}
            >
              <Crosshair className={cn('mt-0.5 size-4 shrink-0', dimension === 'auto' ? 'text-emerald-400' : 'text-emerald-600')} />
              <span>
                <span className="block text-sm font-semibold">{weakest ? 'My weakest skill' : "AI's pick"}</span>
                <span className={cn('block text-xs mt-0.5', dimension === 'auto' ? 'text-zinc-300' : 'text-zinc-500')}>
                  {weakest ? `${weakest.label} · avg ${weakest.average}/100` : 'Based on your resume - finish an interview to target weak spots'}
                </span>
              </span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              {DRILL_DIMENSIONS.map(([id, label]) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={dimension === id}
                  onClick={() => setDimension(id)}
                  className={cn(
                    'cursor-pointer rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all',
                    dimension === id
                      ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <label className="mt-5 block">
            <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Specific topic (optional)</span>
            <input
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
              maxLength={300}
              placeholder="e.g. React re-renders, SQL joins"
              className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition"
            />
          </label>
          <Button variant="brand" className="mt-5 w-full" onClick={createDrill} loading={busy === 'creating'}>
            {busy !== 'creating' && <Sparkles className="size-4" />} Generate drill
          </Button>
        </Panel>

        <Panel className="min-h-[420px] p-5 sm:p-6 shadow-sm">
          <AnimatePresence mode="wait">
            {busy === 'creating' ? (
              <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid h-full min-h-80 place-items-center text-center">
                <div>
                  <Spinner className="mx-auto size-7 text-zinc-950" />
                  <p className="mt-4 font-semibold text-zinc-900">Writing a question for you...</p>
                  <p className="text-xs mt-1 text-zinc-500">Tailored to your resume and skill selection</p>
                </div>
              </motion.div>
            ) : drill ? (
              <motion.div
                key={drill.id + drill.status}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="space-y-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {drill.dimensionLabel && <Badge tone="brand">{drill.dimensionLabel}</Badge>}
                  {drill.kind && <Badge>{TOPIC_KIND_LABELS[drill.kind] ?? drill.kind}</Badge>}
                  <Badge>{drill.roleTitle}</Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{drill.topicTitle}</p>
                  <h2 className="mt-1 text-lg sm:text-xl font-bold text-zinc-950 leading-snug">{drill.question}</h2>
                  {drill.whyThisDrill && <p className="mt-2 text-xs leading-relaxed text-zinc-600">{drill.whyThisDrill}</p>}
                </div>

                {drill.status === 'open' ? (
                  <div>
                    <textarea
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && answer.trim().length >= 10) submitAnswer();
                      }}
                      rows={7}
                      maxLength={5000}
                      disabled={busy === 'grading'}
                      placeholder="Answer as you would out loud. Aim for 80-200 words: context, what you did, and the measurable outcome."
                      className="w-full resize-y rounded-xl border border-zinc-200 bg-white p-3.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition disabled:opacity-60"
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-xs text-zinc-400">{words} words · Ctrl + Enter to submit</span>
                      <Button variant="brand" onClick={submitAnswer} loading={busy === 'grading'} disabled={answer.trim().length < 10}>
                        {busy === 'grading' ? 'Grading...' : 'Get feedback'} {busy !== 'grading' && <ArrowRight className="size-4" />}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <details className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5">
                      <summary className="cursor-pointer text-xs font-semibold text-zinc-800">Your answer</summary>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-700">{drill.answer}</p>
                    </details>
                    <DrillFeedback drill={drill} />
                    <Button variant="brand" onClick={createDrill}>
                      <RotateCcw className="size-4" /> Next drill
                    </Button>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid h-full min-h-80 place-items-center text-center">
                <div className="max-w-sm">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-950">
                    <Dumbbell className="size-5 text-emerald-600" />
                  </span>
                  <p className="mt-4 text-base font-bold text-zinc-950">Five minutes, one skill</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                    Generate a drill and answer it. You get rubric scores, quotes from your answer as evidence, and what a strong answer covers.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>
      </div>

      {answered.length > 0 && (
        <Panel className="p-5 sm:p-6 shadow-sm">
          <PanelHeader title="Recent drills" />
          <ul className="mt-4 divide-y divide-zinc-100">
            {answered.slice(0, 8).map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setDrill(item)}
                  className="-mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-zinc-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs sm:text-sm font-semibold text-zinc-950">{item.question}</span>
                    <span className="text-xs text-zinc-400 mt-0.5 block">
                      {item.dimensionLabel ?? item.topicTitle} · {timeAgo(item.answeredAt ?? item.createdAt)}
                    </span>
                  </span>
                  <span className={cn('text-sm font-bold tabular-nums', SCORE_TEXT[scoreTone(item.score)])}>
                    {item.score}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </Page>
  );
}
