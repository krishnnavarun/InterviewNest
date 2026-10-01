import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Award, BarChart3, Crosshair, Dumbbell, FileText, Gauge, MessagesSquare, Mic, PlayCircle, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Page, Stagger, StaggerItem, motion } from '@/components/ui/motion';
import { Badge } from '@/components/ui/badge';
import { StatTile } from '@/components/charts/StatTile';
import { ScoreTrendChart } from '@/components/charts/ScoreTrendChart';
import { DimensionBars } from '@/components/charts/DimensionBars';
import { useAuth } from '@/context/AuthContext';
import { progressApi } from '@/lib/services';
import { errorMessage } from '@/lib/api';
import { firstName, greeting, SCORE_TEXT, scoreTone, timeAgo } from '@/lib/format';
import { DIMENSIONS } from '@/constants/interview';

const STEPS = [
  { icon: FileText, title: 'Upload your resume', text: 'AI turns it into a structured profile of your skills and projects.' },
  { icon: Target, title: 'Pick a role', text: 'Optionally paste a job description to target your skill gaps.' },
  { icon: Mic, title: 'Talk it through', text: 'Answer by voice or text - the interviewer adapts to every answer.' },
];

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

  return (
    <Page className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-brand-600">{greeting()}</p>
          <h1 className="text-title mt-1.5 text-ink-950">{firstName(user?.name)}, ready to practise?</h1>
        </div>
        <Button variant="ink" size="lg" onClick={() => navigate('/interview/new')}>
          Start new interview <ArrowRight className="size-4" />
        </Button>
      </div>

      {inProgress && (
        <Panel tone="plum" className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <span className="grid size-11 place-items-center rounded-xl bg-white/10">
              <PlayCircle className="size-5" />
            </span>
            <div>
              <p className="font-semibold">You have an interview in progress</p>
              <p className="text-sm text-white/60">
                {inProgress.roleTitle} · {inProgress.difficultyLabel} · topic {inProgress.progress} · started {timeAgo(inProgress.createdAt)}
              </p>
            </div>
          </div>
          <Button variant="light" onClick={() => navigate(`/interview/${inProgress.id}`)}>
            Resume interview
          </Button>
        </Panel>
      )}

      {isNew ? (
        <Panel tone="plum" className="p-6 sm:p-8">
          <Badge tone="brand">Get started</Badge>
          <h2 className="mt-4 max-w-xl text-2xl font-bold tracking-tight">Your first mock interview takes about 15 minutes.</h2>
          <p className="mt-2 max-w-xl text-white/60">
            You'll get a scored report with evidence from your own answers, speech analytics, and a personal study plan.
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-white text-ink-950">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-xs font-semibold text-white/40">STEP {index + 1}</span>
                </div>
                <p className="mt-4 font-semibold">{title}</p>
                <p className="mt-1 text-sm text-white/55">{text}</p>
              </li>
            ))}
          </ol>
          <Button variant="light" size="lg" className="mt-8" onClick={() => navigate('/interview/new')}>
            Start my first interview <ArrowRight className="size-4" />
          </Button>
        </Panel>
      ) : (
        <>
          <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StaggerItem>
              <StatTile label="Interviews completed" value={stats.completed} icon={BarChart3} />
            </StaggerItem>
            <StaggerItem>
              <StatTile label="Average score" value={stats.averageScore} suffix="/100" icon={Gauge} />
            </StaggerItem>
            <StaggerItem>
              <StatTile label="Best score" value={stats.bestScore} suffix="/100" icon={Award} />
            </StaggerItem>
            <StaggerItem>
              <StatTile label="Latest score" value={stats.lastScore} suffix="/100" delta={stats.trend} deltaLabel="over last 5" icon={TrendingUp} />
            </StaggerItem>
          </Stagger>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                to: '/practice',
                icon: Dumbbell,
                title: 'Practise your weakest skill',
                text: weakAreas[0] ? `A 5-minute drill on ${weakAreas[0].label}, graded instantly.` : 'A 5-minute drill, graded instantly against a rubric.',
              },
              {
                to: '/coach',
                icon: MessagesSquare,
                title: 'Ask your AI coach',
                text: 'Get answers from your own interview history, with sources.',
              },
            ].map(({ to, icon: Icon, title, text }) => (
              <motion.button
                key={to}
                onClick={() => navigate(to)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 350, damping: 24 }}
                className="surface-dark flex cursor-pointer items-center gap-4 rounded-2xl p-5 text-left text-white"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-ink-950">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-heading block">{title}</span>
                  <span className="text-caption text-white/55">{text}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-white/50" />
              </motion.button>
            ))}
          </div>

          {/* minmax(0, ...) lets the chart shrink with the viewport instead of widening the grid. */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Panel className="min-w-0 p-5 sm:p-6">
              <PanelHeader title="Overall score over time" description="Each point is one completed interview" />
              <div className="mt-5">
                <ScoreTrendChart points={series} />
              </div>
            </Panel>

            <Panel className="p-5 sm:p-6">
              <PanelHeader title="Skill breakdown" description="Average of your last 5 interviews" />
              <DimensionBars className="mt-6" items={dimensionItems} />
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr] lg:items-start">
            <Panel tone="plum" className="p-5 sm:p-6">
              <PanelHeader title="Focus next" description="Your next interview will re-test these" />
              {weakAreas.length ? (
                <ul className="mt-5 space-y-3">
                  {weakAreas.map((area) => (
                    <li key={area.dimension} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 font-medium">
                          <Crosshair className="size-4 text-amber-300" aria-hidden="true" />
                          {area.label}
                        </span>
                        <span className="text-sm text-white/60 tabular-nums">avg {area.average}</span>
                      </div>
                    </li>
                  ))}
                  {/* The note is the top improvement from the latest report - not specific to one skill. */}
                  {weakAreas.find((area) => area.note) && (
                    <li className="text-sm text-white/55">
                      <span className="text-white/75">From your last report:</span> {weakAreas.find((area) => area.note).note}
                    </li>
                  )}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-white/60">No weak areas right now - every skill averages 65 or more. Try Advanced difficulty.</p>
              )}
              <Button variant="light" className="mt-5 w-full" onClick={() => navigate('/interview/new')}>
                Practise now
              </Button>
            </Panel>

            <Panel className="p-5 sm:p-6">
              <PanelHeader
                title="Recent interviews"
                action={
                  <Link to="/history" className="text-sm font-medium text-white/60 hover:text-white">
                    View all
                  </Link>
                }
              />
              <ul className="mt-4 divide-y divide-white/[0.06]">
                {[...series]
                  .reverse()
                  .slice(0, 5)
                  .map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/interview/${item.id}/report`}
                        className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-white/[0.04]"
                      >
                        <div>
                          <p className="font-medium">{item.roleTitle}</p>
                          <p className="text-xs text-white/45">
                            {item.difficultyLabel} · {timeAgo(item.date)}
                          </p>
                        </div>
                        <span className={`text-lg font-semibold tabular-nums ${SCORE_TEXT[scoreTone(item.overall)]}`}>{item.overall}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {usage && (
        <p className="text-center text-xs text-ink-700/70">
          Today: {usage.interviewsStarted}/{usage.interviewLimit} interviews · {usage.aiCalls} AI calls · {usage.tokens.toLocaleString()} tokens
        </p>
      )}
    </Page>
  );
}
