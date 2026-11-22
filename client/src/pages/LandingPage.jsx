import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Check,
  ChevronRight,
  Code2,
  FileText,
  Lock,
  Mail,
  Menu,
  MessagesSquare,
  Mic,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Terminal,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GitHubIcon, LinkedInIcon } from '@/components/auth/AuthLayout';
import { GoogleSignInSection } from '@/components/auth/GoogleSignInButton';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { AnimatePresence, EASE, Reveal, Stagger, StaggerItem, motion } from '@/components/ui/motion';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/lib/api';

const PREVIEW = [
  { from: 'ai', text: 'Tell me about a system you improved and the trade-off you made.' },
  { from: 'you', text: 'I reduced checkout latency by adding Redis caching for product availability.' },
  { from: 'ai', text: 'Nice. How did you handle stale data when inventory changed?', tag: 'Smart follow-up' },
];

const TRACKS = [
  {
    role: 'Full Stack & Backend',
    title: 'Distributed Systems & Coding',
    category: 'High concurrency',
    duration: '40 min',
    tags: ['System Design', 'Redis & SQL', 'Sandbox tests'],
    description: 'Deep dive into caching strategies, DB bottlenecks, latency trade-offs, and an executable coding round.',
  },
  {
    role: 'Frontend Architect',
    title: 'Modern UI & Web Performance',
    category: 'Core Web Vitals',
    duration: '35 min',
    tags: ['React Concurrency', 'State Hydration', 'CSS Scale'],
    description: 'Explain rendering architectures, state sync under latency, and build clean UI logic in Monaco.',
  },
  {
    role: 'AI / ML Engineer',
    title: 'Model Evaluation & LLM Systems',
    category: 'Frontier AI',
    duration: '45 min',
    tags: ['RAG Retrieval', 'Vector Search', 'Python Sandbox'],
    description: 'Discuss prompt injection defence, embeddings, guardrails, and implement live data-transformation algorithms.',
  },
  {
    role: 'Engineering Manager',
    title: 'Architecture & Leadership',
    category: 'Strategic Impact',
    duration: '30 min',
    tags: ['Trade-offs', 'Team Scaling', 'Conflict Resolution'],
    description: 'Walk through real high-stakes decisions, post-mortem analysis, and engineering team performance.',
  },
];

const STEPS = [
  {
    number: '01',
    icon: FileText,
    title: 'Bring your real experience',
    text: 'Upload your resume or paste a target job description so every prompt specifically tests your real work.',
  },
  {
    number: '02',
    icon: MessagesSquare,
    title: 'Have the adaptive conversation',
    text: 'Answer naturally by voice or text while your interviewer adapts in real time, digging into gaps and nudging when stuck.',
  },
  {
    number: '03',
    icon: Code2,
    title: 'Pass the sandbox coding round',
    text: 'Work through practical problems in a live browser runner. Hidden tests execute in an isolated sandbox with instant feedback.',
  },
  {
    number: '04',
    icon: Target,
    title: 'Leave with evidence-backed feedback',
    text: 'Every score cites verbatim quotes from what you said, with fact-guarded rewrites and targeted practice drills.',
  },
];

const FEATURES = [
  {
    icon: BrainCircuit,
    title: 'Adaptive AI that actually listens',
    text: 'Natalie listens to your answers and decides whether to probe deeper, provide a nudge, or advance topic based on your depth.',
  },
  {
    icon: BadgeCheck,
    title: 'Evidence-grounded rubrics',
    text: 'Scores above 3/5 must cite verbatim quotes from your answers. Hallucinations are rejected and unsupported scores are capped.',
  },
  {
    icon: Terminal,
    title: 'Executable coding sandbox',
    text: 'Problems include executable reference solutions and verified tests that run inside safe Web Workers and Pyodide.',
  },
];

const QUOTES = [
  {
    quote: 'I stopped memorising rehearsed scripts and learned how to structure my real decisions. Natalie caught the gaps in my system design immediately.',
    name: 'Aisha R.',
    role: 'Senior Frontend Engineer',
  },
  {
    quote: 'The evidence-backed grading was a game changer. Seeing quotes of where I gave vague answers helped me speak with tangible metrics.',
    name: 'Marco T.',
    role: 'Backend Developer',
  },
  {
    quote: 'The combination of adaptive follow-ups and a real coding round gave me the exact confidence I needed to land my staff offer.',
    name: 'Priya S.',
    role: 'Product Engineer',
  },
];

function MicroButton({
  children,
  onClick,
  variant = 'white',
  size = 'md',
  className = '',
  ...props
}) {
  const isWhite = variant === 'white';
  const isDark = variant === 'dark';
  const isGhost = variant === 'ghost';

  if (isGhost) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white/90 transition-colors hover:text-white ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center gap-2.5 rounded-full font-semibold transition-all duration-200 active:scale-[0.98] ${
        isWhite
          ? 'bg-white text-zinc-950 shadow-md shadow-black/10 hover:bg-zinc-100'
          : 'bg-zinc-950 text-white shadow-md shadow-black/20 hover:bg-zinc-800'
      } ${
        size === 'sm'
          ? 'px-3.5 py-1.5 text-xs'
          : size === 'lg'
          ? 'px-6 py-3 text-sm sm:text-base'
          : 'px-4.5 py-2 text-xs sm:text-sm'
      } ${className}`}
      {...props}
    >
      <span>{children}</span>
      <span
        className={`grid place-items-center rounded-md transition-transform group-hover:translate-x-0.5 ${
          isWhite ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-950'
        } ${size === 'sm' ? 'size-4.5' : size === 'lg' ? 'size-5.5' : 'size-5'}`}
      >
        <ChevronRight className={size === 'sm' ? 'size-2.5' : 'size-3'} strokeWidth={2.5} />
      </span>
    </button>
  );
}

function FloatingDock({ user, primary, onAuth, onNavigate }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.4);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <motion.aside
      aria-label="Floating quick navigation"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
    >
      <nav
        aria-label="Quick links"
        className="pointer-events-auto flex items-center gap-2 sm:gap-5 rounded-full border border-zinc-200/90 bg-white/95 px-3.5 py-1.5 shadow-xl shadow-black/8 backdrop-blur-xl"
      >
        <a href="#" className="flex items-center gap-1.5 pl-1 pr-1.5 text-xs sm:text-sm font-extrabold tracking-tight text-zinc-950">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span>in.</span>
        </a>
        <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-zinc-600">
          <a href="#tracks" className="transition-colors hover:text-zinc-950">Tracks</a>
          <a href="#showcase" className="transition-colors hover:text-zinc-950">AI Interviewer</a>
          <a href="#how-it-works" className="transition-colors hover:text-zinc-950">How it works</a>
          <a href="#features" className="transition-colors hover:text-zinc-950">Why us</a>
          <a href="#stories" className="transition-colors hover:text-zinc-950">Reviews</a>
        </div>
        <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
          {!user && (
            <button
              type="button"
              onClick={() => onAuth('login')}
              className="px-2 py-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950 transition-colors"
            >
              Sign in
            </button>
          )}
          <MicroButton
            variant="dark"
            size="sm"
            onClick={() => (user ? onNavigate(primary.to) : onAuth('signup'))}
          >
            {primary.label}
          </MicroButton>
        </div>
      </nav>
    </motion.aside>
  );
}

function InterviewPreview() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => setCount((value) => (value >= PREVIEW.length ? 1 : value + 1)), 2400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="relative overflow-hidden rounded-[28px] border border-zinc-950/10 bg-[#120e1d] p-5 text-white shadow-[0_24px_70px_-20px_rgba(20,10,35,0.35)] sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3.5">
            <span className="relative size-11 shrink-0 rounded-full ring-2 ring-emerald-400/40">
              <img
                src="/natalie-avatar.jpg"
                alt="Natalie · AI Interviewer"
                className="size-full rounded-full object-cover shadow-md"
              />
              <span className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-[#120e1d] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </span>
            <div>
              <p className="font-semibold text-sm sm:text-base">Natalie · AI interviewer</p>
              <p className="text-xs text-white/50">Software engineer · Behavioural & System Design round</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live session
            </span>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/60">Turn 2 of 5</span>
          </div>
        </div>

        <div className="mt-5 min-h-[180px] space-y-3">
          <AnimatePresence initial={false}>
            {PREVIEW.slice(0, count).map((message) => (
              <motion.div
                key={message.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                className={message.from === 'you' ? 'ml-auto max-w-[85%]' : 'max-w-[88%]'}
              >
                {message.tag && (
                  <span className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-200">
                    <Sparkles className="size-3" /> {message.tag}
                  </span>
                )}
                <div
                  className={
                    message.from === 'you'
                      ? 'rounded-2xl rounded-tr-md bg-white px-4 py-3 text-xs sm:text-sm leading-relaxed text-zinc-950 shadow-sm'
                      : 'rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.06] px-4 py-3 text-xs sm:text-sm leading-relaxed text-white/95'
                  }
                >
                  <p>{message.text}</p>
                  {message.from === 'you' && (
                    <div className="mt-2 flex items-center gap-1.5 border-t border-zinc-100 pt-2 text-[11px] font-semibold text-emerald-700">
                      <Check className="size-3 stroke-[3]" />
                      <span>Verified quote grounded in transcript</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-white/10 pt-4 text-center sm:grid-cols-4">
          <div className="rounded-xl bg-white/[0.04] p-2">
            <p className="font-bold text-emerald-400 text-base sm:text-lg">4.5 / 5</p>
            <p className="text-[11px] text-white/50">clarity score</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-2">
            <p className="font-bold text-brand-200 text-base sm:text-lg">Verified</p>
            <p className="text-[11px] text-white/50">evidence match</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-2">
            <p className="font-bold text-white text-base sm:text-lg">Go deeper</p>
            <p className="text-[11px] text-white/50">adaptive decision</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-2">
            <p className="font-bold text-emerald-300 text-base sm:text-lg">3 / 3 pass</p>
            <p className="text-[11px] text-white/50">sandbox tests</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthModal({ mode, onClose, onModeChange }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', remember: true });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const loginMode = mode === 'login';

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!loginMode && form.name.trim().length < 2) nextErrors.name = 'Enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Enter a valid email address';
    if (loginMode ? !form.password : form.password.length < 8) nextErrors.password = loginMode ? 'Enter your password' : 'Use at least 8 characters';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const user = loginMode
        ? await login(form)
        : await register({ name: form.name.trim(), email: form.email, password: form.password });
      toast.success(loginMode ? `Welcome back, ${user.name.split(' ')[0]}!` : `Welcome to InterviewNest, ${user.name.split(' ')[0]}!`);
      onClose();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-zinc-950/45 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <button aria-label="Close authentication form" onClick={onClose} className="absolute inset-0 cursor-default" />
      <div className="relative my-8 w-full max-w-[480px] rounded-[28px] bg-white px-6 py-8 text-zinc-950 sm:px-9 sm:py-9 shadow-2xl">
        <button aria-label="Close authentication form" onClick={onClose} className="absolute top-5 right-5 grid size-9 place-items-center rounded-full border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950">
          <X className="size-4.5" />
        </button>
        <div className="max-w-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">InterviewNest</p>
          <h2 id="auth-modal-title" className="mt-2 text-2xl font-extrabold tracking-tight">{loginMode ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-zinc-600">{loginMode ? 'Log in to continue your interview practice.' : 'Start practising with an interviewer that listens.'}</p>
        </div>
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-3">
          {!loginMode && <Field variant="light" icon={UserRound} label="Your full name" autoComplete="name" value={form.name} onChange={update('name')} error={errors.name} />}
          <Field variant="light" icon={Mail} label="Your username or email" type="email" autoComplete="email" value={form.email} onChange={update('email')} error={errors.email} />
          <Field variant="light" icon={Lock} label="Your password" type="password" autoComplete={loginMode ? 'current-password' : 'new-password'} value={form.password} onChange={update('password')} error={errors.password} />
          {loginMode && (
            <div className="flex items-center justify-between pt-0.5 text-xs sm:text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-zinc-700">
                <input type="checkbox" checked={form.remember} onChange={(event) => setForm((current) => ({ ...current, remember: event.target.checked }))} className="size-4 accent-zinc-950" />
                Remember me
              </label>
              <button type="button" className="font-semibold text-zinc-950 hover:underline">Forgot password?</button>
            </div>
          )}
          <Button type="submit" variant="ink" size="md" className="mt-1.5 w-full text-sm rounded-full shadow-none" loading={submitting}>{loginMode ? 'Log in' : 'Create account'} {!submitting && <ArrowRight className="size-4" />}</Button>
        </form>
        <GoogleSignInSection
          variant="light"
          alwaysShow
          label="Continue with Google"
          onSuccess={() => {
            onClose();
            navigate('/dashboard', { replace: true });
          }}
        />
        <div className="mt-3 grid grid-cols-2 gap-2.5 pt-1">
          <Button
            type="button"
            variant="light"
            size="md"
            className="text-xs sm:text-sm rounded-full ring-1 ring-zinc-200 shadow-none hover:bg-zinc-50"
            onClick={() => toast('LinkedIn sign-in will be available soon.')}
          >
            <LinkedInIcon className="size-4 text-[#0A66C2]" />
            LinkedIn
          </Button>
          <Button
            type="button"
            variant="light"
            size="md"
            className="text-xs sm:text-sm rounded-full ring-1 ring-zinc-200 shadow-none hover:bg-zinc-50"
            onClick={() => toast('GitHub sign-in will be available soon.')}
          >
            <GitHubIcon className="size-4 text-zinc-950" />
            GitHub
          </Button>
        </div>
        <p className="mt-6 text-center text-xs sm:text-sm text-zinc-600">
          {loginMode ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={() => onModeChange(loginMode ? 'signup' : 'login')} className="font-bold text-zinc-950 hover:underline">
            {loginMode ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LandingPage({ initialAuthMode = null }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState(initialAuthMode);
  const primary = user ? { label: 'Open dashboard', to: '/dashboard' } : { label: 'Start practising', to: '/signup' };

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-zinc-950 antialiased selection:bg-brand-500/20">
      {/* Floating Center Dock on Scroll (micro1 style) */}
      <FloatingDock
        user={user}
        primary={primary}
        onAuth={setAuthMode}
        onNavigate={navigate}
      />

      {/* Hero Section with Scenic Mountain Artwork (100% royalty-free custom art) */}
      <div
        className="relative h-screen min-h-screen min-h-[100dvh] h-[100dvh] w-full overflow-hidden bg-[#16273b] bg-cover bg-center text-white flex flex-col justify-between"
        style={{
          backgroundImage: `url('/hero-bg.jpg')`,
        }}
      >
        {/* Subtle dark film grain / vignette overlay for legibility */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/40" />

        {/* Global Navigation Header: Left vertical nav, Center logo, Right auth */}
        <header className="relative z-20 w-full px-8 sm:px-12 lg:px-16 xl:px-20 pt-8 flex items-start justify-between">
          {/* Top Left: Vertical Navigation Links (exact micro1 style) */}
          <nav aria-label="Main navigation" className="hidden lg:flex flex-col items-start gap-2 text-[15px] sm:text-base font-medium text-white/95">
            <a href="#tracks" className="transition-colors hover:text-white hover:translate-x-0.5">Interview tracks</a>
            <a href="#how-it-works" className="transition-colors hover:text-white hover:translate-x-0.5">How it works</a>
            <a href="#showcase" className="transition-colors hover:text-white hover:translate-x-0.5">AI Interviewer</a>
            <a href="#features" className="transition-colors hover:text-white hover:translate-x-0.5">Why InterviewNest</a>
            <a href="#stories" className="transition-colors hover:text-white hover:translate-x-0.5">Reviews</a>
          </nav>

          {/* Center Logo - micro1 lowercase wordmark style */}
          <div className="lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:top-8">
            <Link to="/" className="inline-flex items-center gap-1 text-2xl sm:text-[1.75rem] font-bold tracking-tight text-white hover:opacity-95">
              <span>interviewnest</span>
              <span className="text-emerald-400">.</span>
            </Link>
          </div>

          {/* Right CTAs */}
          <div className="hidden sm:flex items-center gap-5">
            {!user && (
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-sm sm:text-[15px] font-semibold text-white/95 hover:text-white transition-colors"
              >
                Sign in
              </button>
            )}
            <MicroButton
              variant="white"
              size="md"
              onClick={() => (user ? navigate(primary.to) : setAuthMode('signup'))}
            >
              {primary.label}
            </MicroButton>
          </div>

          {/* Mobile menu button */}
          <button
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid size-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md sm:hidden ml-auto"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </header>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="relative z-30 mx-6 mt-2 rounded-2xl border border-white/15 bg-zinc-950/95 p-4 text-white shadow-2xl backdrop-blur-xl sm:hidden">
            <div className="grid gap-2 text-xs sm:text-sm font-medium">
              <a href="#tracks" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/10">Interview tracks</a>
              <a href="#showcase" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/10">AI Interviewer</a>
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/10">How it works</a>
              <a href="#features" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/10">Why InterviewNest</a>
              <a href="#stories" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-white/10">Reviews</a>
              <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-2">
                {!user && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setAuthMode('login'); }}
                    className="rounded-lg px-3 py-2 text-left font-semibold text-white/90 hover:bg-white/10"
                  >
                    Sign in
                  </button>
                )}
                <MicroButton
                  variant="white"
                  size="md"
                  onClick={() => { setMenuOpen(false); user ? navigate(primary.to) : setAuthMode('signup'); }}
                >
                  {primary.label}
                </MicroButton>
              </div>
            </div>
          </div>
        )}

        {/* Hero Content (Left-center vertical alignment like micro1 official) */}
        <div className="relative z-10 w-full px-8 sm:px-12 lg:px-16 xl:px-20 my-auto flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-[-0.035em] text-white leading-[1.06]">
              Leverage your real experience to master next-generation AI interviews
            </h1>
            <div className="mt-7 sm:mt-9">
              <MicroButton
                variant="white"
                size="lg"
                onClick={() => (user ? navigate(primary.to) : setAuthMode('signup'))}
              >
                {primary.label}
              </MicroButton>
            </div>
          </div>
        </div>

        {/* Seamless bottom mist fade into the clean light canvas */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 sm:h-52 bg-gradient-to-t from-[#fbfaf8] via-[#fbfaf8]/75 to-transparent" />
      </div>

      {/* Main Body Canvas */}
      <main className="relative z-10 bg-[#fbfaf8]">
        {/* Showcase Section (Clean positive spacing, NO overlap collision) */}
        <section id="showcase" className="relative z-20 mx-auto max-w-4xl px-5 py-20 sm:py-28 sm:px-8">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
              <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
              Live interactive rehearsal
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
              See how Natalie adapts to every answer
            </h2>
          </div>

          <InterviewPreview />

          <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-zinc-500">
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-600" /> Resume-aware prompts</span>
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-600" /> Live voice or text answers</span>
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-600" /> Grounded evidence grading</span>
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-600" /> Isolated sandbox execution</span>
          </div>
        </section>

        {/* Practice Tracks Section */}
        <section id="tracks" className="mx-auto max-w-7xl px-5 pt-12 pb-20 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Practice Tracks</p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
                Choose your interview track
              </h2>
            </div>
            <p className="max-w-md text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Every track features role-specific rubrics, verified coding challenges, and strict guardrails that simulate high-bar interviews.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {TRACKS.map((track) => (
              <div
                key={track.role}
                className="group flex flex-col justify-between rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-zinc-800">{track.category}</span>
                    <span className="text-zinc-500">{track.duration}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold tracking-tight text-zinc-950 group-hover:text-brand-600 transition-colors">
                    {track.role}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-zinc-500">{track.title}</p>
                  <p className="mt-3 text-xs leading-relaxed text-zinc-600">{track.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100">
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {track.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 border border-zinc-200/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <MicroButton
                    variant="dark"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => (user ? navigate('/setup') : setAuthMode('signup'))}
                  >
                    Start track
                  </MicroButton>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-12 border-t border-zinc-200/80 px-5 py-20 sm:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">The Process</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
              Prepare with intention, not just repetition.
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-zinc-600">
              A structured rehearsal engine that tests your genuine depth, flags unsupported claims, and leaves you with an exact blueprint to improve.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ number, icon: Icon, title, text }) => (
              <article
                key={title}
                className="flex flex-col justify-between rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-2xl bg-zinc-950 text-white shadow-sm">
                      <Icon className="size-4.5" />
                    </span>
                    <span className="text-xs font-bold text-zinc-400">{number}</span>
                  </div>
                  <h3 className="mt-5 text-base font-bold tracking-tight text-zinc-950">{title}</h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-zinc-600">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Why InterviewNest (Core Pillars) */}
        <section id="features" className="scroll-mt-12 bg-zinc-950 px-5 py-20 text-white sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-300">Why InterviewNest</p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Engineered for the moment you get stuck.
              </h2>
              <p className="mt-2.5 text-xs sm:text-sm text-zinc-400">
                Not a static question bot. Every turn is calibrated against strict rubrics, quote verification, and deterministic scoring.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="rounded-3xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.08]"
                >
                  <span className="grid size-11 place-items-center rounded-2xl bg-brand-500/20 text-brand-300">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold tracking-tight text-white">{title}</h3>
                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-zinc-400">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Candidate Reviews & Stories */}
        <section id="stories" className="mx-auto max-w-7xl scroll-mt-12 px-5 py-20 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Learner Stories</p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
                Confidence built on honest feedback.
              </h2>
            </div>
            <div className="flex items-center gap-1 text-amber-500 text-xs sm:text-sm font-semibold">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-2 text-zinc-700">4.9 / 5 from engineers</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {QUOTES.map(({ quote, name, role }) => (
              <blockquote
                key={name}
                className="flex flex-col justify-between rounded-3xl border border-zinc-200/90 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <p className="text-xs sm:text-sm font-semibold leading-relaxed text-zinc-800">
                  “{quote}”
                </p>
                <footer className="mt-6 border-t border-zinc-100 pt-4 text-xs">
                  <strong className="block font-bold text-zinc-950">{name}</strong>
                  <span className="text-zinc-500">{role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="mx-5 mb-20 overflow-hidden rounded-[32px] bg-zinc-950 px-6 py-14 text-center text-white sm:mx-auto sm:max-w-7xl sm:px-10 sm:py-16 shadow-2xl">
          <div className="mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-200">
              <Zap className="size-3.5 text-brand-300" />
              Start in under 60 seconds
            </span>
            <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              You do not need more confidence. You need one more good rehearsal.
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-zinc-400">
              Start with a role, a resume, or just the question you keep avoiding.
            </p>
            <div className="mt-7 flex justify-center">
              <MicroButton
                variant="white"
                size="md"
                onClick={() => (user ? navigate(primary.to) : setAuthMode('signup'))}
              >
                {primary.label}
              </MicroButton>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-1 text-xl font-bold tracking-tight text-zinc-950">
            <span>interviewnest</span>
            <span className="text-emerald-500">.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-zinc-600">
            <a href="#tracks" className="hover:text-zinc-950 transition-colors">Tracks</a>
            <a href="#showcase" className="hover:text-zinc-950 transition-colors">AI Interviewer</a>
            <a href="#how-it-works" className="hover:text-zinc-950 transition-colors">How it works</a>
            <a href="#features" className="hover:text-zinc-950 transition-colors">Why us</a>
            <a href="#stories" className="hover:text-zinc-950 transition-colors">Reviews</a>
          </div>
          <p className="text-xs text-zinc-500">© 2026 InterviewNest. All rights reserved.</p>
        </div>
      </footer>

      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onModeChange={setAuthMode} />}
    </div>
  );
}
