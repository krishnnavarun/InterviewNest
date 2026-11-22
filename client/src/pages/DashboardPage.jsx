import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Award,
  BarChart3,
  CheckCircle2,
  Crosshair,
  Dumbbell,
  FileText,
  Gauge,
  History,
  Mic,
  PlayCircle,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Page, Stagger, StaggerItem } from '@/components/ui/motion';
import { ScoreTrendChart } from '@/components/charts/ScoreTrendChart';
import { DimensionBars } from '@/components/charts/DimensionBars';
import { useAuth } from '@/context/AuthContext';
import { progressApi } from '@/lib/services';
import { errorMessage } from '@/lib/api';
import { firstName, greeting, SCORE_TEXT, scoreTone, timeAgo } from '@/lib/format';
import { DIMENSIONS } from '@/constants/interview';

const STEPS = [
  { icon: FileText, title: 'Bring your story', text: 'Upload a resume so prompts reflect your real experience.' },
  { icon: Target, title: 'Choose your target', text: 'Pick a role and difficulty that match your next opportunity.' },
  { icon: Mic, title: 'Have the conversation', text: 'Answer by voice or text while Natalie adapts in real time.' },
];

function StatCard({ children }) {
  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm transition hover:shadow-md">
      {children}
    </div>
  );
}

function ProgressStat({ label, value, suffix, delta, icon: Icon }) {
  const improving = typeof delta === 'number' && delta > 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">{label}</p>
        <span className="grid size-8 place-items-center rounded-xl bg-zinc-100 text-zinc-700">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-950">
        {value ?? '-'}
        {value !== null && value !== undefined && suffix && (
          <span className="ml-1 text-sm font-semibold text-zinc-400">{suffix}</span>
        )}
      </p>
      {typeof delta === 'number' && delta !== 0 && (
        <p className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 ${improving ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {improving ? '+' : ''}{delta} over last 5
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    progressApi
      .get()
      .then(setData)
      .catch((error) => {
        toast.error(errorMessage(error));
        setData({ stats: { completed: 0 }, series: [], dimensionAverages: {}, weakAreas: [], usage: null, inProgress: null });
      });
  }, []);

  if (!data) return <PageSkeleton label="Loading your dashboard..." />;

  const { stats, series, dimensionAverages, weakAreas, inProgress } = data;
  const isNew = stats.completed === 0;
  const dimensionItems = Object.entries(dimensionAverages).map(([id, value]) => ({ id, label: DIMENSIONS[id], value }));
  const latest = series.at(-1);
  const first = firstName(user?.name) || 'there';

  return (
    <Page className="space-y-8">
      {/* Top Welcome & Natalie Hero Card */}
      <section className="relative overflow-hidden rounded-[28px] border border-zinc-200/90 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-5">
            <div className="relative shrink-0">
              <img
                src="/natalie-avatar.jpg"
                alt="Natalie"
                className="size-16 sm:size-20 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-white ring-2 ring-white">
                <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                <Sparkles className="size-3 text-emerald-600" />
                <span>AI Interviewer · Natalie</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
                {greeting()}, {first}! Ready to practise?
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-zinc-600">
                {isNew
                  ? 'A focused 15-minute rehearsal gives you a benchmark, evidence-grounded feedback, and targeted areas to sharpen.'
                  : latest
                    ? `Your latest rehearsal scored ${latest.overall}/100. Let's build your depth on the next round.`
                    : 'Targeted practice with evidence-backed feedback helps you speak with authority in every interview.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {inProgress ? (
              <button
                type="button"
                onClick={() => navigate(`/interview/${inProgress.id}`)}
                className="group inline-flex items-center gap-3 rounded-full bg-emerald-600 pl-4 pr-1.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <span>Resume interview</span>
                <span className="grid size-7 place-items-center rounded-full bg-white/20 text-white transition group-hover:scale-105">
                  <PlayCircle className="size-4" />
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/interview/new')}
                className="group inline-flex items-center gap-3 rounded-full bg-zinc-950 pl-4 pr-1.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
              >
                <span>Start new interview</span>
                <span className="grid size-7 place-items-center rounded-full bg-white/20 text-white transition group-hover:scale-105">
                  <ArrowRight className="size-4" />
                </span>
              </button>
            )}
            <Link
              to="/history"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950"
            >
              <History className="size-4" />
              <span>History</span>
            </Link>
          </div>
        </div>

        {/* Steps for new users */}
        {isNew && (
          <div className="mt-8 border-t border-zinc-100 pt-6">
            <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">How it works</p>
            <ol className="mt-4 grid gap-3 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, text }, index) => (
                <li key={title} className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 transition hover:bg-zinc-50">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-xl bg-white text-zinc-900 shadow-sm border border-zinc-200/60">
                      <Icon className="size-4 text-emerald-600" />
                    </span>
                    <span className="text-xs font-bold text-zinc-400">0{index + 1}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-zinc-900">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {/* Progress Stats */}
      {!isNew && (
        <>
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">Your progress</p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-950">A clearer view of your growth</h2>
              </div>
              <Link to="/history" className="hidden text-xs font-semibold text-zinc-600 hover:text-zinc-950 sm:inline-flex sm:items-center sm:gap-1">
                View history <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StaggerItem>
                <StatCard>
                  <ProgressStat label="Interviews completed" value={stats.completed} icon={BarChart3} />
                </StatCard>
              </StaggerItem>
              <StaggerItem>
                <StatCard>
                  <ProgressStat label="Average score" value={stats.averageScore} suffix="/100" icon={Gauge} />
                </StatCard>
              </StaggerItem>
              <StaggerItem>
                <StatCard>
                  <ProgressStat label="Best score" value={stats.bestScore} suffix="/100" icon={Award} />
                </StatCard>
              </StaggerItem>
              <StaggerItem>
                <StatCard>
                  <ProgressStat label="Recent trend" value={stats.lastScore} suffix="/100" delta={stats.trend} icon={TrendingUp} />
                </StatCard>
              </StaggerItem>
            </Stagger>
          </section>

          {/* Charts Row */}
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.85fr)]">
            <div className="min-w-0 rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-zinc-950">Score trend</h2>
                  <p className="mt-1 text-xs text-zinc-500">Your completed interviews over time</p>
                </div>
              </div>
              <div className="mt-5">
                <ScoreTrendChart points={series} />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-zinc-950">Skill breakdown</h2>
                  <p className="mt-1 text-xs text-zinc-500">Average across your last 5 interviews</p>
                </div>
              </div>
              <DimensionBars className="mt-6" items={dimensionItems} />
            </div>
          </section>

          {/* Next Focus & Recent Interviews */}
          <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-zinc-950">Your next focus</h2>
                  <p className="mt-1 text-xs text-zinc-500">Targeted practice for maximum improvement</p>
                </div>
              </div>
              {weakAreas.length ? (
                <ul className="mt-5 space-y-3">
                  {weakAreas.slice(0, 3).map((area) => (
                    <li key={area.dimension} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3.5">
                      <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                        <Crosshair className="size-4 text-emerald-600" />
                        {area.label}
                      </span>
                      <span className="text-sm font-bold text-zinc-700">{area.average}/100</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 text-xs leading-relaxed text-emerald-950">
                  <CheckCircle2 className="mb-2 size-5 text-emerald-600" />
                  Your skills are trending evenly. Try an advanced interview to stretch your depth.
                </div>
              )}
              <button
                type="button"
                onClick={() => navigate('/practice')}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2.5 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-50 hover:border-zinc-300"
              >
                <Dumbbell className="size-4" /> Open practice drills
              </button>
            </div>

            <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-zinc-950">Recent interviews</h2>
                  <p className="mt-1 text-xs text-zinc-500">Open a report to revisit evidence and feedback</p>
                </div>
                <Link to="/history" className="text-xs font-semibold text-zinc-600 hover:text-zinc-950">
                  View all
                </Link>
              </div>
              {series.length ? (
                <ul className="mt-4 divide-y divide-zinc-100">
                  {[...series].reverse().slice(0, 5).map((item) => (
                    <li key={item.id}>
                      <Link to={`/interview/${item.id}/report`} className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-zinc-50">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-sm text-zinc-950">{item.roleTitle}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">{item.difficultyLabel} · {timeAgo(item.date)}</p>
                        </div>
                        <span className={`text-base font-bold tabular-nums ${SCORE_TEXT[scoreTone(item.overall)]}`}>
                          {item.overall}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-xs text-zinc-500">Your completed interviews will appear here.</p>
              )}
            </div>
          </section>
        </>
      )}
    </Page>
  );
}
