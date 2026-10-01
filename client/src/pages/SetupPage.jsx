import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Check, FileUp, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { Spinner } from '@/components/ui/spinner';
import { PageSkeleton } from '@/components/ui/skeleton';
import { AnimatePresence, EASE, Overlay, Page, motion } from '@/components/ui/motion';
import { Toggle } from '@/components/ui/toggle';
import { Badge } from '@/components/ui/badge';
import { ProfileCard } from '@/components/setup/ProfileCard';
import { GapCard } from '@/components/setup/GapCard';
import { interviewApi, progressApi, resumeApi } from '@/lib/services';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useServerFeatures } from '@/hooks/useServerFeatures';
import { DIFFICULTIES, ROLES, getRole } from '@/constants/interview';

const PLANNING_STAGES = [
  'Reading your resume profile...',
  'Choosing topics for this role...',
  'Writing questions tailored to your projects...',
  'Building a scoring rubric for each topic...',
  'Warming up your interviewer...',
];

function StepIndicator({ step }) {
  const steps = ['Resume', 'Role & focus', 'Start'];
  return (
    <ol className="flex items-center gap-2 text-sm">
      {steps.map((label, index) => {
        const number = index + 1;
        const done = number < step;
        const current = number === step;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                'grid size-7 place-items-center rounded-full text-xs font-semibold',
                done && 'bg-ink-950 text-white',
                current && 'bg-brand-500 text-white',
                !done && !current && 'bg-white/70 text-ink-700'
              )}
            >
              {done ? <Check className="size-3.5" /> : number}
            </span>
            <span className={cn('hidden font-medium sm:inline', current ? 'text-ink-950' : 'text-ink-700/70')}>{label}</span>
            {number < steps.length && <span className="mx-1 h-px w-6 bg-ink-700/25 sm:w-10" />}
          </li>
        );
      })}
    </ol>
  );
}

function PlanningOverlay({ open }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!open) return setStage(0);
    const timer = setInterval(() => setStage((value) => Math.min(value + 1, PLANNING_STAGES.length - 1)), 2600);
    return () => clearInterval(timer);
  }, [open]);
  return (
    <Overlay open={open} label="Designing your interview">
      <Panel tone="plum" className="w-full p-8 text-center" role="status" aria-live="polite">
        <span className="relative mx-auto grid size-16 place-items-center">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-400/40" />
          <span className="relative grid size-16 place-items-center rounded-full border border-white/15 bg-white/10">
            <Wand2 className="size-6" />
          </span>
        </span>
        <p className="mt-6 text-lg font-semibold">Designing your interview</p>
        <ul className="mt-5 space-y-2 text-left text-sm">
          {PLANNING_STAGES.map((label, index) => (
            <li key={label} className={cn('flex items-center gap-2.5 transition-opacity', index > stage && 'opacity-30')}>
              {index < stage ? (
                <Check className="size-4 text-emerald-300" />
              ) : index === stage ? (
                <Spinner className="size-4 text-brand-300" />
              ) : (
                <span className="size-4" />
              )}
              <span className={index <= stage ? 'text-white/85' : 'text-white/50'}>{label}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </Overlay>
  );
}

export default function SetupPage() {
  const navigate = useNavigate();
  const features = useServerFeatures();
  const fileInput = useRef(null);

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [weakAreas, setWeakAreas] = useState([]);

  const [role, setRole] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [jobDescription, setJobDescription] = useState('');
  const [gap, setGap] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [focusWeakAreas, setFocusWeakAreas] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    Promise.all([resumeApi.get(), progressApi.get().catch(() => null)])
      .then(([savedResume, progress]) => {
        setResume(savedResume);
        setWeakAreas(progress?.weakAreas ?? []);
        if (savedResume?.profile?.suggestedRoleIds?.[0]) setRole(savedResume.profile.suggestedRoleIds[0]);
        if (savedResume) setStep(2);
      })
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    setUploadError(null);
    if (file.type !== 'application/pdf') return setUploadError('Please upload a PDF file.');
    if (file.size > 5 * 1024 * 1024) return setUploadError('Please upload a PDF under 5 MB.');
    setUploading(true);
    try {
      const saved = await resumeApi.upload(file);
      setResume(saved);
      setGap(null);
      if (saved.profile.suggestedRoleIds?.[0]) setRole(saved.profile.suggestedRoleIds[0]);
      toast.success('Resume analysed!');
    } catch (error) {
      setUploadError(errorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyzeGap = async () => {
    if (!role) return toast.error('Choose a role first.');
    if (jobDescription.trim().length < 80) return toast.error('Paste the full job description (at least 80 characters).');
    setAnalyzing(true);
    try {
      setGap(await resumeApi.analyzeGap({ role, jobDescription }));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const interview = await interviewApi.start({
        role,
        difficulty,
        jobDescription: jobDescription.trim() || undefined,
        focusWeakAreas: focusWeakAreas && weakAreas.length > 0,
        voiceEnabled,
      });
      navigate(`/interview/${interview.id}`, { state: { interview } });
    } catch (error) {
      toast.error(errorMessage(error));
      setStarting(false);
    }
  };

  if (loading) return <PageSkeleton label="Loading your profile..." />;

  const suggested = new Set(resume?.profile?.suggestedRoleIds ?? []);
  const difficultyInfo = DIFFICULTIES.find((item) => item.id === difficulty);

  return (
    <Page className="mx-auto max-w-4xl space-y-6">
      <PlanningOverlay open={starting} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-eyebrow text-brand-600">Set up</p>
          <h1 className="text-title mt-1 text-ink-950">New interview</h1>
          <p className="mt-1 text-ink-700">The AI builds a personal interview plan from your resume.</p>
        </div>
        <StepIndicator step={step} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="space-y-6"
      >
      {step === 1 && (
        <Panel className="p-5 sm:p-7">
          <PanelHeader
            title="Your resume"
            description="We extract skills, projects and experience so questions are about you, not generic."
            action={
              resume && (
                <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()} loading={uploading}>
                  {!uploading && <RefreshCw className="size-3.5" />} Replace
                </Button>
              )
            }
          />
          <input ref={fileInput} type="file" accept="application/pdf" className="hidden" onChange={(event) => {
              handleFile(event.target.files?.[0]);
              // Reset so choosing the same file again (e.g. after a failed upload) still fires onChange.
              event.target.value = '';
            }}
          />

          <div className="mt-6">
            {resume && !uploading ? (
              <>
                <p className="mb-4 text-xs text-white/45">
                  {resume.fileName} · analysed by AI
                </p>
                <ProfileCard profile={resume.profile} />
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  handleFile(event.dataTransfer.files?.[0]);
                }}
                disabled={uploading}
                className={cn(
                  'flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center transition-colors',
                  dragging ? 'border-brand-300 bg-brand-500/10' : 'border-white/20 bg-white/[0.03] hover:bg-white/[0.05]'
                )}
              >
                {uploading ? (
                  <>
                    <Spinner className="size-8 text-brand-300" />
                    <p className="mt-4 font-semibold">Analysing your resume with AI...</p>
                    <p className="mt-1 text-sm text-white/50">Extracting skills, projects and experience</p>
                  </>
                ) : (
                  <>
                    <span className="grid size-14 place-items-center rounded-2xl bg-white text-ink-950">
                      <FileUp className="size-6" />
                    </span>
                    <p className="mt-4 font-semibold">Drop your resume here, or click to browse</p>
                    <p className="mt-1 text-sm text-white/50">Text-based PDF, up to 5 MB</p>
                  </>
                )}
              </button>
            )}
            {uploadError && !uploading && (
              <p role="alert" className="mt-3 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {uploadError}
              </p>
            )}
          </div>

          <div className="mt-7 flex justify-end">
            <Button variant="light" disabled={!resume || uploading} onClick={() => setStep(2)}>
              Continue <ArrowRight className="size-4" />
            </Button>
          </div>
        </Panel>
      )}

      {step === 2 && (
        <>
          <Panel className="p-5 sm:p-7">
            <PanelHeader title="Choose a role" description="Suggested roles come from your resume." />
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {ROLES.map(({ id, title, icon: Icon, blurb }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setRole(id);
                    setGap(null);
                  }}
                  aria-pressed={role === id}
                  className={cn(
                    'relative flex cursor-pointer flex-col items-start rounded-xl border p-4 text-left transition-all',
                    role === id ? 'border-brand-300/70 bg-brand-500/15 ring-1 ring-brand-300/40' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  )}
                >
                  {suggested.has(id) && (
                    <span className="absolute top-2.5 right-2.5" title="Suggested from your resume">
                      <Sparkles className="size-3.5 text-brand-300" />
                    </span>
                  )}
                  <Icon className="size-5 text-white/80" />
                  <span className="mt-3 text-sm font-semibold">{title}</span>
                  <span className="mt-0.5 text-xs text-white/50">{blurb}</span>
                </button>
              ))}
            </div>

            <h3 className="mt-8 text-sm font-semibold">Difficulty</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {DIFFICULTIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDifficulty(item.id)}
                  aria-pressed={difficulty === item.id}
                  className={cn(
                    'flex cursor-pointer flex-col justify-start rounded-xl border p-4 text-left transition-all',
                    difficulty === item.id ? 'border-brand-300/70 bg-brand-500/15 ring-1 ring-brand-300/40' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-xs text-white/45">{item.minutes} min</span>
                  </div>
                  <p className="mt-1 text-xs text-white/55">{item.description}</p>
                  <p className="mt-2 text-xs text-white/40">{item.topics} topics incl. coding</p>
                </button>
              ))}
            </div>
          </Panel>

          <Panel className="p-5 sm:p-7">
            <PanelHeader
              title="Target a specific job (optional)"
              description="Paste a job description and the AI finds your skill gaps, then aims the interview at them."
            />
            <textarea
              value={jobDescription}
              onChange={(event) => {
                setJobDescription(event.target.value);
                setGap(null);
              }}
              rows={5}
              placeholder="Paste the job description here..."
              className="mt-5 w-full resize-y rounded-xl border border-white/10 bg-white/[0.05] p-4 text-sm text-white placeholder:text-white/35 focus:border-brand-300/50 focus:outline-none"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-white/40">{jobDescription.trim().length} characters</span>
              <Button variant="outline" size="sm" onClick={handleAnalyzeGap} loading={analyzing} disabled={jobDescription.trim().length < 80}>
                {!analyzing && <Sparkles className="size-3.5" />} Analyse fit
              </Button>
            </div>
            {gap && (
              <div className="mt-5">
                <GapCard gap={gap} />
              </div>
            )}
          </Panel>

          <div className="flex justify-between">
            <Button variant="ghost" className="text-ink-700 hover:bg-ink-950/5 hover:text-ink-950" onClick={() => setStep(1)}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button variant="ink" disabled={!role} onClick={() => setStep(3)}>
              Continue <ArrowRight className="size-4" />
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <Panel tone="plum" className="p-6 sm:p-8">
          <PanelHeader
            title="Ready when you are"
            description={
              features.speechToText
                ? 'Find a quiet place. You can answer by voice or by typing.'
                : 'Find a quiet place. You will type your answers - voice answers are not enabled on this server.'
            }
          />

          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <dt className="text-xs text-white/45">Role</dt>
              <dd className="mt-1 font-semibold">{getRole(role)?.title}</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <dt className="text-xs text-white/45">Difficulty</dt>
              <dd className="mt-1 font-semibold">
                {difficultyInfo.label} · {difficultyInfo.minutes} min
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <dt className="text-xs text-white/45">Targeting</dt>
              <dd className="mt-1 font-semibold">{jobDescription.trim().length >= 80 ? 'Your job description' : 'General role'}</dd>
            </div>
          </dl>

          <div className="mt-6 space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <Toggle
              checked={voiceEnabled}
              onChange={setVoiceEnabled}
              label="Voice interviewer"
              description="Natalie reads questions aloud. Turn off for a text-only interview."
            />
            <Toggle
              checked={focusWeakAreas && weakAreas.length > 0}
              onChange={setFocusWeakAreas}
              disabled={weakAreas.length === 0}
              label="Re-test my weak areas"
              description={
                weakAreas.length
                  ? `Includes a topic on: ${weakAreas.map((area) => area.label).join(', ')}`
                  : 'Available after your first completed interview.'
              }
            />
          </div>

          <ul className="mt-6 space-y-1.5 text-sm text-white/60">
            <li>• The interviewer follows up on your answers, like a real interview.</li>
            <li>• The last topic is a coding exercise that runs in your browser.</li>
            <li>• Scores stay hidden until your report is ready.</li>
          </ul>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button variant="light" size="lg" onClick={handleStart} loading={starting}>
              Start interview {!starting && <ArrowRight className="size-4" />}
            </Button>
          </div>
          {weakAreas.length > 0 && focusWeakAreas && (
            <p className="mt-4 text-right">
              <Badge tone="brand">Personalised from your history</Badge>
            </p>
          )}
        </Panel>
      )}
      </motion.div>
      </AnimatePresence>
    </Page>
  );
}
