import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Code2,
  Cpu,
  Lightbulb,
  Mic,
  Quote,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { PageLoader } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { DimensionBars } from '@/components/charts/DimensionBars';
import { ScoreRing } from '@/components/report/ScoreRing';
import { TopicBreakdown } from '@/components/report/TopicBreakdown';
import { interviewApi } from '@/lib/services';
import { errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { DIMENSIONS, HIRING_SIGNALS } from '@/constants/interview';

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-white/45">{hint}</p>}
    </div>
  );
}

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [interview, setInterview] = useState(location.state?.interview?.report ? location.state.interview : null);

  useEffect(() => {
    if (interview) return;
    interviewApi
      .get(id)
      .then((data) => {
        if (data.status === 'in_progress') return navigate(`/interview/${id}`, { replace: true });
        if (!data.report) {
          toast.error('This interview has no report.');
          return navigate('/history', { replace: true });
        }
        setInterview(data);
      })
      .catch((error) => {
        toast.error(errorMessage(error));
        navigate('/history', { replace: true });
      });
  }, [id, interview, navigate]);

  if (!interview) return <PageLoader label="Loading your report..." />;

  const { report } = interview;
  const signal = HIRING_SIGNALS[report.hiringSignal];
  const dimensionItems = Object.entries(report.dimensions).map(([key, value]) => ({ id: key, label: DIMENSIONS[key], value }));
  const submission = interview.coding?.submission;

  return (
    <div className="animate-fade-up space-y-6">
      <Link to="/history" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-ink-950">
        <ArrowLeft className="size-4" /> All interviews
      </Link>

      <Panel tone="plum" className="p-6 sm:p-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center">
          <ScoreRing score={report.overall} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={signal.tone}>
                <CheckCircle2 className="size-3.5" /> {signal.label}
              </Badge>
              {report.partial && (
                <Badge tone="amber">
                  Partial · {report.coverage.covered}/{report.coverage.total} topics
                </Badge>
              )}
              <Badge>
                {interview.roleTitle} · {interview.difficultyLabel}
              </Badge>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{report.headline}</h1>
            <p className="mt-3 leading-relaxed text-white/70">{report.summary}</p>
            <p className="mt-4 text-xs text-white/40">{formatDate(interview.completedAt, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <Panel className="p-5 sm:p-6">
          <PanelHeader title="Skill breakdown" description="Computed from rubric scores - the AI does not pick these numbers" />
          <DimensionBars className="mt-6" items={dimensionItems} />
        </Panel>

        <Panel className="p-5 sm:p-6">
          <PanelHeader title="What went well" />
          <ul className="mt-4 space-y-4">
            {report.strengths.map((item) => (
              <li key={item.point}>
                <p className="flex items-start gap-2 font-medium">
                  <TrendingUp className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden="true" />
                  {item.point}
                </p>
                {item.evidence && (
                  <p className="mt-1.5 ml-6 flex gap-2 text-sm text-white/55 italic">
                    <Quote className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    {item.evidence}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="p-5 sm:p-6">
        <PanelHeader title="What to improve" description="Each point cites where it showed up in your interview" />
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {report.improvements.map((item) => (
            <li key={item.point} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="flex items-start gap-2 font-medium">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
                {item.point}
              </p>
              {item.evidence && <p className="mt-2 text-sm text-white/50 italic">{item.evidence}</p>}
              <p className="mt-3 text-sm text-white/75">
                <span className="font-semibold text-white">How: </span>
                {item.howToImprove}
              </p>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        {report.speech ? (
          <Panel className="p-5 sm:p-6">
            <PanelHeader title="How you sounded" description={`From ${report.speech.answers} voice answer${report.speech.answers === 1 ? '' : 's'}`} />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Stat label="Speaking pace" value={`${report.speech.wpm} wpm`} hint={`${report.speech.pace} · aim for 120-160`} />
              <Stat label="Filler words" value={`${report.speech.fillersPerMin}/min`} hint={report.speech.topFillers.map((item) => `"${item.word}" ×${item.count}`).join(', ') || 'None detected'} />
              <Stat label="Long pauses (2s+)" value={report.speech.longPauseCount} hint={`Longest ${report.speech.longestPauseSec}s`} />
              <Stat label="Speaking time" value={`${Math.round(report.speech.totalSpeakingSec / 60)} min`} />
            </div>
            {report.communicationTips.length > 0 && (
              <ul className="mt-5 space-y-2 text-sm text-white/70">
                {report.communicationTips.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <Mic className="mt-0.5 size-3.5 shrink-0 text-brand-300" aria-hidden="true" />
                    {tip}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ) : (
          <Panel className="p-5 sm:p-6">
            <PanelHeader title="How you sounded" description="You typed your answers, so there are no speech analytics this time." />
            <ul className="mt-5 space-y-2 text-sm text-white/70">
              {report.communicationTips.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <Mic className="mt-0.5 size-3.5 shrink-0 text-brand-300" aria-hidden="true" />
                  {tip}
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <Panel className="p-5 sm:p-6">
          <PanelHeader title="Coding round" description={report.coding ? report.coding.problem : 'Not reached in this interview'} />
          {report.coding && (
            <>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Stat label="Tests passed" value={report.coding.testsPassed} hint={`in ${report.coding.language}`} />
                <Stat label="Your complexity" value={report.coding.timeComplexity ?? '-'} hint={`Optimal: ${report.coding.optimalComplexity}`} />
              </div>
              <p className="mt-4 text-sm text-white/70">{report.coding.reviewSummary}</p>
              {report.coding.issues?.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm text-white/60">
                  {report.coding.issues.map((issue) => (
                    <li key={issue} className="flex gap-2">
                      <Code2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> {issue}
                    </li>
                  ))}
                </ul>
              )}
              {submission && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-white/60 hover:text-white">View your code</summary>
                  <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-black/30 p-3 font-mono text-xs text-white/80">{submission.code}</pre>
                </details>
              )}
            </>
          )}
        </Panel>
      </div>

      <Panel tone="plum" className="p-5 sm:p-6">
        <PanelHeader title="Your study plan" description="Prioritised by your weakest skills" />
        <ol className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {report.studyPlan.map((item, index) => (
            <li key={item.topic} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-white/45">
                <BookOpen className="size-3.5" /> STEP {index + 1}
              </p>
              <p className="mt-2 font-semibold">{item.topic}</p>
              <p className="mt-1 text-sm text-white/55">{item.why}</p>
              <p className="mt-3 text-sm text-white/80">{item.practice}</p>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel className="p-5 sm:p-6">
        <PanelHeader title="Topic by topic" description="Rubric scores, the evidence behind them, and why the interviewer asked each follow-up" />
        <div className="mt-5">
          <TopicBreakdown topics={interview.topics} turns={interview.turns} topicScores={report.topicScores} />
        </div>
      </Panel>

      <Panel className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-300" /> {report.grounding.verifiedQuotes} evidence quotes verified
            {report.grounding.rejectedQuotes > 0 && `, ${report.grounding.rejectedQuotes} rejected`}
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="size-3.5" /> {interview.aiStats.calls} AI calls ·{' '}
            {(interview.aiStats.promptTokens + interview.aiStats.outputTokens).toLocaleString()} tokens
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>
          <Button variant="light" size="sm" onClick={() => navigate('/interview/new')}>
            <RotateCcw className="size-3.5" /> Practise again
          </Button>
        </div>
      </Panel>
    </div>
  );
}
