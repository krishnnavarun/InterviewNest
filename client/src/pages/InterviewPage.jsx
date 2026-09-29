import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle, Clock, LogOut, RotateCw } from 'lucide-react';
import { Logo } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { PageLoader, Spinner } from '@/components/ui/spinner';
import { ConfirmDialog } from '@/components/ui/dialog';
import { InterviewerCard } from '@/components/interview/InterviewerCard';
import { Transcript } from '@/components/interview/Transcript';
import { Composer } from '@/components/interview/Composer';
import { TopicRail } from '@/components/interview/TopicRail';
import { CodingWorkspace } from '@/components/interview/CodingWorkspace';
import { interviewApi } from '@/lib/services';
import { errorMessage } from '@/lib/api';
import { formatDuration } from '@/lib/format';
import { useInterviewerVoice } from '@/hooks/useInterviewerVoice';
import { useServerFeatures } from '@/hooks/useServerFeatures';

const spokenText = (turn) => [turn?.text, turn?.question].filter(Boolean).join(' ');

function useElapsed(since) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!since) return;
    const update = () => setSeconds((Date.now() - new Date(since).getTime()) / 1000);
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [since]);
  return seconds;
}

export default function InterviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [interview, setInterview] = useState(location.state?.interview ?? null);
  const [pending, setPending] = useState(null); // text shown while waiting for the AI
  const [finishing, setFinishing] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [voiceOn, setVoiceOn] = useState(location.state?.interview?.voiceEnabled ?? true);

  const elapsed = useElapsed(interview?.createdAt);
  const features = useServerFeatures();
  const voice = useInterviewerVoice(id, voiceOn, features.textToSpeech);
  const { stop: stopVoice } = voice;
  const speakTurn = useCallback((turn) => turn && voice.speak(turn.index, spokenText(turn)), [voice]);

  const finishingRef = useRef(false);
  const finish = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    try {
      const result = await interviewApi.finish(id);
      if (result.status === 'abandoned') {
        toast('Interview ended before any answers - no report this time.');
        navigate('/dashboard', { replace: true });
      } else {
        navigate(`/interview/${id}/report`, { replace: true, state: { interview: result } });
      }
    } catch (error) {
      toast.error(errorMessage(error));
      finishingRef.current = false;
      setFinishing(false);
    }
  }, [id, navigate]);

  // Initial load. Safe to run twice (React StrictMode): a cancelled run is ignored.
  useEffect(() => {
    let cancelled = false;

    const boot = (data) => {
      if (cancelled) return;
      if (data.status === 'completed') return navigate(`/interview/${id}/report`, { replace: true });
      if (data.status === 'abandoned') return navigate('/dashboard', { replace: true });
      setInterview(data);
      setVoiceOn(data.voiceEnabled);
      if (data.phase === 'wrap_up') return finish();
      // Generate the coding problem in the background while the candidate talks.
      if (data.coding.status !== 'ready') interviewApi.prepareCoding(id).catch(() => {});
      const lastInterviewer = [...data.turns].reverse().find((turn) => turn.speaker === 'interviewer');
      if (data.voiceEnabled && data.phase === 'conversation') speakTurn(lastInterviewer);
    };

    if (location.state?.interview?.id === id) boot(location.state.interview);
    else
      interviewApi
        .get(id)
        .then(boot)
        .catch((error) => {
          if (cancelled) return;
          toast.error(errorMessage(error));
          navigate('/dashboard', { replace: true });
        });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const applyResult = useCallback(
    (result) => {
      setInterview((current) => {
        const turns = current.turns.filter((turn) => !turn.optimistic);
        return {
          ...current,
          ...result.state,
          turns: [...turns, result.candidateTurn, result.interviewerTurn],
          coding: result.coding ?? current.coding,
        };
      });
      // Coding transitions show the problem on screen; everything else is spoken.
      if (result.state.phase !== 'coding') speakTurn(result.interviewerTurn);
      // The farewell keeps playing while the report is generated.
      if (result.state.phase === 'wrap_up') finish();
    },
    [finish, speakTurn]
  );

  // A failed submission is kept so the candidate can retry without retyping or re-recording.
  const [failed, setFailed] = useState(null);

  const submit = async (request, optimisticTurn, pendingLabel) => {
    stopVoice();
    setFailed(null);
    if (optimisticTurn) {
      setInterview((current) => ({
        ...current,
        turns: [...current.turns.filter((turn) => !turn.optimistic), { ...optimisticTurn, index: `optimistic-${Date.now()}`, optimistic: true }],
      }));
    }
    setPending(pendingLabel);
    try {
      const result = await request();
      if (result.results) toast.success(`${result.results.passed}/${result.results.total} tests passed`);
      applyResult(result);
    } catch (error) {
      setFailed({ message: errorMessage(error), retry: () => submit(request, optimisticTurn, pendingLabel) });
    } finally {
      setPending(null);
    }
  };

  const handleText = (text) =>
    submit(() => interviewApi.answerText(id, text), { speaker: 'candidate', text, inputMode: 'text' }, 'Natalie is thinking...');

  const handleVoice = (blob) => submit(() => interviewApi.answerAudio(id, blob), null, 'Transcribing your answer...');

  const handleCode = (payload) => submit(() => interviewApi.submitCode(id, payload), null, 'Reviewing your code...');

  const failureBanner = failed && (
    <div role="alert" className="mx-4 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm sm:mx-5">
      <span className="flex items-center gap-2 text-amber-100">
        <AlertTriangle className="size-4 shrink-0 text-amber-300" aria-hidden="true" />
        {failed.message} Your answer was kept.
      </span>
      <span className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => {
          setFailed(null);
          setInterview((current) => ({ ...current, turns: current.turns.filter((turn) => !turn.optimistic) }));
        }}>
          Discard
        </Button>
        <Button size="sm" variant="light" onClick={failed.retry}>
          <RotateCw className="size-3.5" /> Retry
        </Button>
      </span>
    </div>
  );

  if (!interview) return <PageLoader label="Joining your interview..." />;

  const { turns, topics, phase, currentTopicIndex } = interview;
  const lastInterviewer = [...turns].reverse().find((turn) => turn.speaker === 'interviewer');
  const inCoding = phase === 'coding' && interview.coding?.problem;
  const status = finishing ? 'finishing' : pending ? 'thinking' : voice.speaking ? 'speaking' : inCoding ? 'coding' : 'listening';

  return (
    <div className="flex h-dvh flex-col bg-[radial-gradient(120%_70%_at_50%_0%,#3b1a5a_0%,#140d1d_45%,#0b0910_100%)] text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Logo className="text-white [&>span:last-child]:hidden md:[&>span:last-child]:inline" />
          <span className="hidden h-5 w-px bg-white/15 sm:block" />
          <p className="hidden text-sm text-white/60 sm:block">
            {interview.roleTitle} · {interview.difficultyLabel}
          </p>
        </div>
        <TopicRail topics={topics} currentIndex={currentTopicIndex} done={phase === 'wrap_up' || finishing} />
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm text-white/55 tabular-nums">
            <Clock className="size-4" /> {formatDuration(elapsed)}
          </span>
          <Button variant="outline" size="sm" onClick={() => setConfirmEnd(true)} disabled={finishing}>
            <LogOut className="size-3.5" /> End
          </Button>
        </div>
      </header>

      {inCoding ? (
        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
          <InterviewerCard
            compact
            status={status}
            turn={lastInterviewer}
            voiceOn={voiceOn}
            onToggleVoice={() => {
              stopVoice();
              setVoiceOn((value) => !value);
            }}
            onReplay={() => speakTurn(lastInterviewer)}
            blocked={voice.blocked}
            onResume={voice.resume}
          />
          {failureBanner && <div className="-mx-4 sm:-mx-5">{failureBanner}</div>}
          <CodingWorkspace problem={interview.coding.problem} disabled={Boolean(pending)} onSubmit={handleCode} />
        </main>
      ) : (
        <main className="grid min-h-0 flex-1 gap-4 p-4 sm:p-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <InterviewerCard
              status={status}
              turn={lastInterviewer}
              voiceOn={voiceOn}
              onToggleVoice={() => {
                stopVoice();
                setVoiceOn((value) => !value);
              }}
              onReplay={() => speakTurn(lastInterviewer)}
              blocked={voice.blocked}
              onResume={voice.resume}
            />
            <p className="mt-4 px-2 text-xs leading-relaxed text-white/40">
              Topic {Math.min(currentTopicIndex + 1, topics.length)} of {topics.length}: {topics[currentTopicIndex]?.title}. Scores stay hidden
              until your report.
            </p>
          </div>

          <section className="surface-ink flex min-h-0 flex-col overflow-hidden rounded-3xl">
            <div className="lg:hidden">
              <InterviewerCard
                compact
                status={status}
                turn={null}
                voiceOn={voiceOn}
                onToggleVoice={() => {
                  stopVoice();
                  setVoiceOn((value) => !value);
                }}
                onReplay={() => speakTurn(lastInterviewer)}
                blocked={voice.blocked}
                onResume={voice.resume}
              />
            </div>
            <Transcript turns={turns} pending={pending} className="min-h-0 flex-1" />
            {failureBanner}
            {phase === 'conversation' && !finishing ? (
              <Composer
                busy={Boolean(pending)}
                disabled={finishing}
                onStartRecording={stopVoice}
                onVoiceAnswer={handleVoice}
                onTextAnswer={handleText}
                voiceInput={features.speechToText}
              />
            ) : (
              <div className="flex items-center justify-center gap-3 border-t border-white/[0.08] p-5 text-sm text-white/60">
                <Spinner className="size-4" /> Preparing your feedback report...
              </div>
            )}
          </section>
        </main>
      )}

      {finishing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm" role="status">
          <div className="surface-dark w-full max-w-sm rounded-3xl p-8 text-center">
            <Spinner className="mx-auto size-8 text-brand-300" />
            <p className="mt-5 text-lg font-semibold">Writing your feedback report</p>
            <p className="mt-2 text-sm text-white/55">Scoring each topic against its rubric and checking every piece of evidence...</p>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmEnd}
        title="End the interview now?"
        description="You'll get a report on the topics you've covered so far. You can't resume after ending."
        confirmLabel="End & get report"
        onClose={() => setConfirmEnd(false)}
        onConfirm={() => {
          setConfirmEnd(false);
          finish();
        }}
      />
    </div>
  );
}
