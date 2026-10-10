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
  MessageCircle,
  Mic,
  PlayCircle,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Page, Stagger, StaggerItem } from '@/components/ui/motion';
import { Badge } from '@/components/ui/badge';
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
  { icon: Mic, title: 'Have the conversation', text: 'Answer by voice or text while the interviewer adapts.' },
];

function StatCard({ children }) {
  return <div className="rounded-2xl border border-ink-950/10 bg-white p-5 shadow-[0_12px_30px_-24px_rgba(27,16,47,0.8)]">{children}</div>;
}

function ProgressStat({ label, value, suffix, delta, icon: Icon }) {
  const improving = typeof delta === 'number' && delta > 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-700">{label}</p>
        <Icon className="size-5 text-brand-600" aria-hidden="true" />
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-ink-950">
        {value ?? '-'}
        {value !== null && value !== undefined && suffix && <span className="ml-1 text-base font-semibold text-ink-700">{suffix}</span>}
      </p>
      {typeof delta === 'number' && delta !== 0 && (
        <p className={`mt-1.5 text-sm font-semibold ${improving ? 'text-emerald-700' : 'text-red-600'}`}>
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

  const { stats, series, dimensionAverages, weakAreas, usage, inProgress } = data;
  const isNew = stats.completed === 0;
  const dimensionItems = Object.entries(dimensionAverages).map(([id, value]) => ({ id, label: DIMENSIONS[id], value }));
  const latest = series.at(-1);
  const first = firstName(user?.name) || 'there';

  return (
    <Page className="space-y-7">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-eyebrow text-brand-600">{greeting()}</p>
          <h1 className="mt-2 text-display max-w-2xl text-ink-950">{first}, ready to practise?</h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-700">
            Build sharper answers through realistic practice, then use your feedback to decide what to rehearse next.
          </p>
        </div>
        <Button variant="ink" size="lg" className="shrink-0" onClick={() => navigate('/interview/new')}>
          Start new interview <ArrowRight className="size-4" />
        </Button>
      </section>

      {inProgress && (
        <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-ink-950 sm:p-6">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-xl bg-brand-600 text-white">
              <PlayCircle className="size-6" />
            </span>
            <div>
              <p className="font-semibold">Your interview is waiting</p>
              <p className="mt-1 text-sm text-ink-700">
                {inProgress.roleTitle} · {inProgress.difficultyLabel} · {inProgress.progress} topics covered
              </p>
            </div>
          </div>
          <Button variant="ink" onClick={() => navigate(`/interview/${inProgress.id}`)}>
            Resume interview <ArrowRight className="size-4" />
          </Button>
        </section>
      )}

      <section className="overflow-hidden rounded-[26px] bg-gradient-to-br from-plum-800 via-plum-900 to-ink-950 p-6 text-white shadow-[0_24px_55px_-36px_rgba(40,20,67,0.9)] sm:p-8">
        <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <Badge tone="brand">{isNew ? 'Your first step' : 'Keep your momentum'}</Badge>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              {isNew ? 'Make your first interview count.' : latest ? `Your latest score was ${latest.overall}/100.` : 'Your next good answer is one rehearsal away.'}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/75">
              {isNew
                ? 'A focused 15-minute rehearsal gives you a baseline, evidence-backed feedback, and a clear next move.'
                : 'Use your latest feedback to practise one skill at a time. Consistency matters more than getting everything perfect.'}
            </p>
          </div>
          {!isNew && latest && (
            <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/[0.08] px-5 py-4">
              <span className="grid size-12 place-items-center rounded-xl bg-brand-500/25 text-brand-200">
                <TrendingUp className="size-6" />
              </span>
              <div>
                <p className="text-3xl font-bold leading-none">{latest.overall}<span className="ml-1 text-base font-medium text-white/55">/100</span></p>
                <p className="mt-1 text-sm text-white/65">latest interview score</p>
              </div>
            </div>
          )}
        </div>

        {isNew ? (
          <>
            <ol className="mt-8 grid gap-3 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, text }, index) => (
                <li key={title} className="rounded-2xl border border-white/15 bg-white/[0.08] p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-white text-ink-950"><Icon className="size-5" /></span>
                    <span className="text-xs font-bold tracking-[0.12em] text-white/55">0{index + 1}</span>
                  </div>
                  <p className="mt-5 font-semibold">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{text}</p>
                </li>
              ))}
            </ol>
            <Button variant="light" size="lg" className="mt-7" onClick={() => navigate('/interview/new')}>
              Start my first interview <ArrowRight className="size-4" />
            </Button>
          </>
        ) : (
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="light" size="lg" onClick={() => navigate('/interview/new')}>Practise again <ArrowRight className="size-4" /></Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/history')}>Review feedback <History className="size-4" /></Button>
          </div>
        )}
      </section>

      {!isNew && (
        <>
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-eyebrow text-brand-600">Your progress</p>
                <h2 className="text-title mt-1 text-ink-950">A clearer view of your growth</h2>
              </div>
              <Link to="/history" className="hidden text-sm font-semibold text-brand-700 hover:text-brand-900 sm:inline-flex sm:items-center sm:gap-1">View history <ArrowRight className="size-4" /></Link>
            </div>
            <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StaggerItem><StatCard><ProgressStat label="Interviews completed" value={stats.completed} icon={BarChart3} /></StatCard></StaggerItem>
              <StaggerItem><StatCard><ProgressStat label="Average score" value={stats.averageScore} suffix="/100" icon={Gauge} /></StatCard></StaggerItem>
              <StaggerItem><StatCard><ProgressStat label="Best score" value={stats.bestScore} suffix="/100" icon={Award} /></StatCard></StaggerItem>
              <StaggerItem><StatCard><ProgressStat label="Recent trend" value={stats.lastScore} suffix="/100" delta={stats.trend} icon={TrendingUp} /></StatCard></StaggerItem>
            </Stagger>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.85fr)]">
            <Panel className="min-w-0 border border-white/10 p-5 sm:p-6">
              <PanelHeader title="Score trend" description="Your completed interviews over time" />
              <div className="mt-5"><ScoreTrendChart points={series} /></div>
            </Panel>
            <Panel className="p-5 sm:p-6">
              <PanelHeader title="Skill breakdown" description="Average across your last 5 interviews" />
              <DimensionBars className="mt-6" items={dimensionItems} />
            </Panel>
          </section>

          <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <Panel tone="plum" className="p-5 sm:p-6">
              <PanelHeader title="Your next focus" description="Small practice, targeted improvement" />
              {weakAreas.length ? (
                <ul className="mt-5 space-y-3">
                  {weakAreas.slice(0, 3).map((area) => (
                    <li key={area.dimension} className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/[0.08] p-4">
                      <span className="flex items-center gap-2 text-sm font-semibold"><Crosshair className="size-4 text-brand-200" />{area.label}</span>
                      <span className="text-sm font-semibold text-white/70">{area.average}/100</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 rounded-xl border border-white/15 bg-white/[0.08] p-4 text-sm leading-relaxed text-white/75">
                  <CheckCircle2 className="mb-2 size-5 text-emerald-300" />
                  Your skills are trending evenly. Try an advanced interview to stretch your range.
                </div>
              )}
              <Button variant="light" className="mt-5 w-full" onClick={() => navigate('/practice')}><Dumbbell className="size-4" /> Open practice drills</Button>
            </Panel>

            <Panel className="p-5 sm:p-6">
              <PanelHeader title="Recent interviews" description="Open a report to revisit your evidence and feedback" action={<Link to="/history" className="text-sm font-semibold text-white/75 hover:text-white">View all</Link>} />
              {series.length ? (
                <ul className="mt-4 divide-y divide-white/10">
                  {[...series].reverse().slice(0, 5).map((item) => (
                    <li key={item.id}>
                      <Link to={`/interview/${item.id}/report`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-3.5 transition-colors hover:bg-white/[0.06]">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{item.roleTitle}</p>
                          <p className="mt-1 text-sm text-white/60">{item.difficultyLabel} · {timeAgo(item.date)}</p>
                        </div>
                        <span className={`text-xl font-bold tabular-nums ${SCORE_TEXT[scoreTone(item.overall)]}`}>{item.overall}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-white/65">Your completed interviews will appear here.</p>
              )}
            </Panel>
          </section>
        </>
      )}

      {usage && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-ink-950/10 pt-5 text-sm text-ink-700">
          <span className="font-semibold text-ink-950">Today</span>
          <span>{usage.interviewsStarted}/{usage.interviewLimit} interviews</span>
          <span aria-hidden="true">·</span>
          <span>{usage.aiCalls} AI calls</span>
          <span aria-hidden="true">·</span>
          <span>{usage.tokens.toLocaleString()} tokens</span>
        </div>
      )}
    </Page>
  );
}
