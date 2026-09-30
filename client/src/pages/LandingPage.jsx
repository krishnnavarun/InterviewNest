import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Code2,
  Dumbbell,
  FileText,
  MessagesSquare,
  Mic,
  ShieldCheck,
  Sparkles,
  Target,
  Wand2,
} from 'lucide-react';
import { RadialBackground } from '@/components/ui/light-theme-tailwind-css-background-snippet';
import { Logo } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { AnimatePresence, EASE, Reveal, Stagger, StaggerItem, motion } from '@/components/ui/motion';
import { useAuth } from '@/context/AuthContext';

const PREVIEW = [
  { from: 'ai', text: 'You mentioned Redis caching at BrightCart. How did you decide what to invalidate?' },
  { from: 'you', text: 'We keyed listings by category and invalidated on every product update...' },
  { from: 'ai', text: 'Good. What happens under a burst of updates to one category?', tag: 'Probing deeper' },
];

const STEPS = [
  { icon: FileText, title: 'Upload your resume', text: 'AI extracts your skills, projects and experience into a structured profile.' },
  { icon: Target, title: 'Target a real job', text: 'Paste a job description to find your skill gaps - the interview aims at them.' },
  { icon: Mic, title: 'Interview & improve', text: 'Talk it through, get an evidence-based report, then practise your weak spots.' },
];

const FEATURES = [
  { icon: BrainCircuit, title: 'Adaptive interviewer', text: 'Every answer is graded against a rubric, then the agent decides: follow up, probe deeper, give a hint, or move on.' },
  { icon: BadgeCheck, title: 'Evidence-grounded scores', text: 'Each score cites a verbatim quote. Hallucinated quotes are rejected and unsupported scores are capped.' },
  { icon: Code2, title: 'A real coding round', text: 'AI-written problems with tests verified against a reference solution. Your JS or Python runs in the browser.' },
  { icon: Wand2, title: 'Answer coach', text: 'See your own answer rewritten to score higher. A fact guard checks every sentence against what you said and flags anything you did not.' },
  { icon: Dumbbell, title: 'Targeted drills', text: 'One-question practice aimed at your weakest skill, graded instantly with the same rubric engine.' },
  { icon: MessagesSquare, title: 'AI career coach', text: 'Ask about your progress. Answers are retrieved from your own interview history, with citations.' },
];

const METRICS = [
  { value: '0.35', label: 'mean error vs human graders (1-5 scale)' },
  { value: '100%', label: 'of AI scores within 1 point of human labels' },
  { value: '3 / 3', label: 'prompt-injection attempts caught' },
];

function InterviewPreview() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const timer = setInterval(() => setCount((value) => (value >= PREVIEW.length ? 1 : value + 1)), 2200);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="surface-dark relative rounded-3xl p-5 text-white shadow-2xl shadow-brand-900/30 sm:p-6">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <span className="relative grid size-10 place-items-center rounded-full bg-gradient-to-b from-brand-400/70 to-plum-900 font-semibold">
          N
          <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-plum-900 bg-emerald-400" />
        </span>
        <div>
          <p className="text-sm font-semibold">Natalie · AI Interviewer</p>
          <p className="text-caption text-white/50">Full Stack Developer · Standard</p>
        </div>
        <span className="ml-auto rounded-full bg-white/10 px-2.5 py-1 text-caption text-white/70">Topic 2 of 5</span>
      </div>
      <div className="mt-4 min-h-56 space-y-3">
        <AnimatePresence initial={false}>
          {PREVIEW.slice(0, count).map((message) => (
            <motion.div
              key={message.text}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className={message.from === 'you' ? 'ml-auto max-w-[85%]' : 'max-w-[88%]'}
            >
              {message.tag && (
                <span className="mb-1 inline-flex items-center gap-1 text-caption text-brand-200">
                  <Sparkles className="size-3" /> {message.tag}
                </span>
              )}
              <p
                className={
                  message.from === 'you'
                    ? 'rounded-2xl rounded-tr-md bg-white px-4 py-2.5 text-sm text-ink-950'
                    : 'rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm'
                }
              >
                {message.text}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
        {[
          ['Technical depth', '4/5'],
          ['Evidence', 'verified'],
          ['Next move', 'probe'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white/[0.05] px-2 py-2">
            <p className="text-sm font-semibold">{value}</p>
            <p className="text-caption text-white/45">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const primary = user ? { label: 'Open dashboard', to: '/dashboard' } : { label: 'Start practising free', to: '/signup' };

  return (
    <div className="relative isolate min-h-screen overflow-hidden text-ink-950">
      <RadialBackground className="fixed" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          {!user && (
            <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 transition-colors hover:text-ink-950">
              Sign in
            </Link>
          )}
          <Button variant="ink" size="sm" onClick={() => navigate(primary.to)}>
            {user ? 'Dashboard' : 'Get started'}
          </Button>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
          <Stagger>
            <StaggerItem>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-white/70 px-3 py-1 text-caption text-brand-700 shadow-sm backdrop-blur">
                <Sparkles className="size-3.5" /> AI mock interviews that adapt to you
              </span>
            </StaggerItem>
            <StaggerItem>
              <h1 className="text-display mt-6 max-w-xl">
                Walk into your next interview <span className="text-brand-500">already prepared.</span>
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-700">
                Natalie, your AI interviewer, asks about your real projects, follows up like a senior engineer, runs a coding round, and
                grades every answer with evidence.
              </p>
            </StaggerItem>
            <StaggerItem className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="ink" size="lg" onClick={() => navigate(primary.to)}>
                {primary.label} <ArrowRight className="size-4" />
              </Button>
              {!user && (
                <Link to="/login" className="px-3 py-2 text-sm font-semibold text-ink-700 hover:text-ink-950">
                  I already have an account
                </Link>
              )}
            </StaggerItem>
            <StaggerItem className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-700">
              {['Resume-aware questions', 'Voice or text answers', 'Free to try'].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-brand-500" /> {item}
                </span>
              ))}
            </StaggerItem>
          </Stagger>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}>
            <InterviewPreview />
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <Reveal>
            <p className="text-eyebrow text-brand-600">How it works</p>
            <h2 className="text-title mt-2 max-w-xl">From resume to a sharper answer in three steps</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 0.08}>
                <div className="surface-ink h-full rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-white text-ink-950">
                      <Icon className="size-5" />
                    </span>
                    <span className="text-eyebrow text-white/35">Step {index + 1}</span>
                  </div>
                  <h3 className="text-heading mt-5">{title}</h3>
                  <p className="text-body mt-1.5 text-white/60">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <Reveal>
            <p className="text-eyebrow text-brand-600">What the AI does</p>
            <h2 className="text-title mt-2 max-w-2xl">More than a chatbot asking questions</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={(index % 3) * 0.06}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="surface-dark h-full rounded-2xl p-6 text-white"
                >
                  <span className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.07]">
                    <Icon className="size-5 text-brand-200" />
                  </span>
                  <h3 className="text-heading mt-5">{title}</h3>
                  <p className="text-body mt-1.5 text-white/60">{text}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <Reveal>
            <div className="surface-ink rounded-3xl p-6 text-white sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
                <div>
                  <p className="text-eyebrow text-brand-200">Measured, not claimed</p>
                  <h2 className="text-title mt-2">The AI grader is tested like software</h2>
                  <p className="text-body mt-3 text-white/60">
                    An evaluation suite compares the AI&apos;s scores with human-labelled answers, including adversarial ones that try to
                    manipulate the grader.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {METRICS.map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                      <p className="text-3xl font-bold tracking-tight">{metric.value}</p>
                      <p className="text-caption mt-2 text-white/55">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-24 text-center sm:px-6">
          <Reveal>
            <h2 className="text-title">Your next interview is a practice run away.</h2>
            <p className="text-body mx-auto mt-3 max-w-lg text-ink-700">Takes about 15 minutes. You get a scored report, a study plan and a coach.</p>
            <Button variant="ink" size="lg" className="mt-7" onClick={() => navigate(primary.to)}>
              {primary.label} <ArrowRight className="size-4" />
            </Button>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-ink-950/10 py-6 text-center text-caption text-ink-700/80">
        InterviewNest · Built with React, Node.js, MongoDB and Google Gemini
      </footer>
    </div>
  );
}
