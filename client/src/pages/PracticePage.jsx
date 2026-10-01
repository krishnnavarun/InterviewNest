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
      <StaggerItem className="flex flex-wrap items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div className="text-center">
          <p className={cn('text-5xl font-bold tracking-tight', SCORE_TEXT[scoreTone(drill.score)])}>
            <AnimatedNumber value={drill.score} />
          </p>
          <p className="text-caption text-white/45">out of 100</p>
        </div>
        <p className="text-body min-w-0 flex-1 text-white/75">{feedback.evaluation.summary}</p>
      </StaggerItem>

      <StaggerItem>
        <p className="text-eyebrow mb-3 text-white/45">Rubric</p>
        <ul className="space-y-2.5">
          {feedback.evaluation.criteria.map((criterion) => (
            <li key={criterion.criterion} className="rounded-xl bg-black/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{criterion.criterion}</p>
                <ScorePips score={criterion.score} />
              </div>
              {criterion.evidence && (
                <p className="mt-2 flex gap-2 text-sm text-white/60 italic">
                  <Quote className="mt-0.5 size-3.5 shrink-0 text-brand-300" aria-hidden="true" />"{criterion.evidence}"
                </p>
              )}
            </li>
          ))}
        </ul>
      </StaggerItem>

      <StaggerItem className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-eyebrow flex items-center gap-1.5 text-emerald-300/90">
            <CheckCircle2 className="size-3.5" /> What worked
          </p>
          <ul className="text-body mt-3 space-y-2 text-white/75">
            {(feedback.strengths.length ? feedback.strengths : ['Not much yet - the outline below shows what to cover.']).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-eyebrow flex items-center gap-1.5 text-amber-300/90">
            <Lightbulb className="size-3.5" /> Improve next time
          </p>
          <ul className="text-body mt-3 space-y-2 text-white/75">
            {feedback.improvements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </StaggerItem>

      <StaggerItem className="rounded-2xl border border-brand-400/20 bg-brand-500/10 p-4">
        <p className="text-eyebrow flex items-center gap-1.5 text-brand-200">
          <ListChecks className="size-3.5" /> A strong answer covers
        </p>
        <ol className="text-body mt-3 list-decimal space-y-1.5 pl-5 text-white/80">
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
  const [busy, setBusy] = useState(null); // 'creating' | 'grading'

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
          <p className="text-eyebrow text-brand-600">Practice</p>
          <h1 className="text-title mt-1">Targeted drills</h1>
          <p className="text-body mt-1 text-ink-700">One focused question at a time, graded instantly against a rubric.</p>
        </div>
        {answered.length > 0 && (
          <div className="flex gap-3 text-sm text-ink-700">
            <span className="rounded-xl bg-white/70 px-3 py-2 shadow-sm">
              <strong className="text-ink-950">{answered.length}</strong> {answered.length === 1 ? 'drill' : 'drills'} done
            </span>
            {history.stats?.averageScore !== null && history.stats?.averageScore !== undefined && (
              <span className="rounded-xl bg-white/70 px-3 py-2 shadow-sm">
                avg <strong className="text-ink-950">{history.stats.averageScore}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Panel tone="plum" className="h-fit p-5 sm:p-6">
          <PanelHeader title="New drill" description="Pick a skill to sharpen, or let the AI choose." />
          <div className="mt-5 space-y-2" role="radiogroup" aria-label="Skill to practise">
            <button
              role="radio"
              aria-checked={dimension === 'auto'}
              onClick={() => setDimension('auto')}
              className={cn(
                'flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                dimension === 'auto' ? 'border-brand-300/60 bg-brand-500/15' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
              )}
            >
              <Crosshair className="mt-0.5 size-4 shrink-0 text-amber-300" />
              <span>
                <span className="block text-sm font-semibold">{weakest ? 'My weakest skill' : "AI's pick"}</span>
                <span className="text-caption text-white/55">
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
                    'cursor-pointer rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors',
                    dimension === id ? 'border-brand-300/60 bg-brand-500/15' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <label className="mt-5 block">
            <span className="text-caption text-white/55">Specific topic (optional)</span>
            <input
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
              maxLength={300}
              placeholder="e.g. React re-renders, SQL joins"
              className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm text-white placeholder:text-white/35 focus:border-brand-300/50 focus:outline-none"
            />
          </label>
          <Button variant="light" className="mt-5 w-full" onClick={createDrill} loading={busy === 'creating'}>
            {busy !== 'creating' && <Sparkles className="size-4" />} Generate drill
          </Button>
        </Panel>

        <Panel className="min-h-[420px] p-5 sm:p-6">
          <AnimatePresence mode="wait">
            {busy === 'creating' ? (
              <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid h-full min-h-80 place-items-center text-center">
                <div>
                  <Spinner className="mx-auto size-7 text-brand-300" />
                  <p className="mt-4 font-semibold">Writing a question for you...</p>
                  <p className="text-caption mt-1 text-white/50">Tailored to your resume and weakest skill</p>
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
                  <p className="text-caption text-white/45">{drill.topicTitle}</p>
                  <h2 className="mt-1 text-xl leading-snug font-semibold">{drill.question}</h2>
                  {drill.whyThisDrill && <p className="text-body mt-2 text-white/55">{drill.whyThisDrill}</p>}
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
                      placeholder="Answer as you would out loud. Aim for 80-200 words: context, what you did, the result."
                      className="text-body w-full resize-y rounded-xl border border-white/10 bg-white/[0.05] p-4 text-white placeholder:text-white/35 focus:border-brand-300/50 focus:outline-none disabled:opacity-60"
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-caption text-white/45">{words} words · Ctrl + Enter to submit</span>
                      <Button variant="light" onClick={submitAnswer} loading={busy === 'grading'} disabled={answer.trim().length < 10}>
                        {busy === 'grading' ? 'Grading...' : 'Get feedback'} {busy !== 'grading' && <ArrowRight className="size-4" />}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <details className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <summary className="cursor-pointer text-sm font-medium text-white/70">Your answer</summary>
                      <p className="text-body mt-2 whitespace-pre-wrap text-white/70">{drill.answer}</p>
                    </details>
                    <DrillFeedback drill={drill} />
                    <Button variant="light" onClick={createDrill}>
                      <RotateCcw className="size-4" /> Next drill
                    </Button>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid h-full min-h-80 place-items-center text-center">
                <div className="max-w-sm">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-ink-950">
                    <Dumbbell className="size-6" />
                  </span>
                  <p className="text-heading mt-5">Five minutes, one skill</p>
                  <p className="text-body mt-1.5 text-white/55">
                    Generate a drill and answer it. You get rubric scores, quotes from your answer as evidence, and what a strong answer covers.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>
      </div>

      {answered.length > 0 && (
        <Panel className="p-5 sm:p-6">
          <PanelHeader title="Recent drills" />
          <ul className="mt-4 divide-y divide-white/[0.06]">
            {answered.slice(0, 8).map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setDrill(item)}
                  className="-mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center justify-between gap-4 rounded-lg px-2 py-3 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{item.question}</span>
                    <span className="text-caption text-white/45">
                      {item.dimensionLabel ?? item.topicTitle} · {timeAgo(item.answeredAt ?? item.createdAt)}
                    </span>
                  </span>
                  <span className={cn('text-lg font-semibold tabular-nums', SCORE_TEXT[scoreTone(item.score)])}>{item.score}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </Page>
  );
}
