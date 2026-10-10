import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Check,
  Code2,
  FileText,
  Lock,
  Mail,
  Menu,
  MessagesSquare,
  Mic,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GitHubIcon, LinkedInIcon, Logo } from '@/components/auth/AuthLayout';
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

const STEPS = [
  { number: '01', icon: FileText, title: 'Bring your real story', text: 'Upload a resume or add a role so every prompt is relevant to the work you want.' },
  { number: '02', icon: MessagesSquare, title: 'Have the conversation', text: 'Answer by voice or text while your interviewer adapts to your confidence and depth.' },
  { number: '03', icon: Target, title: 'Leave with a plan', text: 'Get evidence-backed feedback and focused drills for the skills that need one more rep.' },
];

const FEATURES = [
  { icon: BrainCircuit, title: 'A thinking interviewer', text: 'Follow-ups respond to what you actually said, not a fixed list of questions.' },
  { icon: BadgeCheck, title: 'Feedback you can trust', text: 'Scores point to your own words, so you always know what to keep and what to change.' },
  { icon: Code2, title: 'Practice the hard round', text: 'Work through realistic coding prompts with runnable tests and clear explanations.' },
];

const QUOTES = [
  { quote: 'I stopped memorising perfect answers and started explaining my actual decisions.', name: 'Aisha R.', role: 'Frontend engineer' },
  { quote: 'The follow-up questions are where InterviewNest feels surprisingly human.', name: 'Marco T.', role: 'Backend developer' },
  { quote: 'I knew exactly what to practise before my next interview. That changed everything.', name: 'Priya S.', role: 'Product engineer' },
];

function InterviewPreview() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => setCount((value) => (value >= PREVIEW.length ? 1 : value + 1)), 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto max-w-[620px]">
      <div className="absolute -inset-5 rounded-[38px] bg-brand-300/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-[#181321] p-5 text-white shadow-[0_30px_80px_-30px_rgba(40,20,60,0.65)] sm:p-7">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <span className="relative grid size-11 place-items-center rounded-full bg-gradient-to-br from-brand-300 to-plum-800 font-bold">
            N
            <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-[#181321] bg-emerald-400" />
          </span>
          <div>
            <p className="font-semibold">Natalie · AI interviewer</p>
            <p className="text-sm text-white/45">Software engineer · Behavioural round</p>
          </div>
          <span className="ml-auto hidden rounded-full bg-white/10 px-3 py-1 text-xs text-white/60 sm:inline">Live practice</span>
        </div>
        <div className="mt-5 min-h-[210px] space-y-3">
          <AnimatePresence initial={false}>
            {PREVIEW.slice(0, count).map((message) => (
              <motion.div
                key={message.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                className={message.from === 'you' ? 'ml-auto max-w-[82%]' : 'max-w-[88%]'}
              >
                {message.tag && (
                  <span className="mb-1 flex items-center gap-1 text-xs text-brand-200">
                    <Sparkles className="size-3" /> {message.tag}
                  </span>
                )}
                <p className={message.from === 'you' ? 'rounded-2xl rounded-tr-md bg-white px-4 py-3 text-sm leading-relaxed text-ink-950' : 'rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-relaxed'}>
                  {message.text}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 text-center">
          <div><p className="font-semibold text-emerald-300">4.5/5</p><p className="mt-1 text-xs text-white/40">clarity</p></div>
          <div><p className="font-semibold text-brand-200">Verified</p><p className="mt-1 text-xs text-white/40">evidence</p></div>
          <div><p className="font-semibold text-white">Go deeper</p><p className="mt-1 text-xs text-white/40">next move</p></div>
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
      navigate(loginMode ? '/dashboard' : '/dashboard', { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink-950/35 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <button aria-label="Close authentication form" onClick={onClose} className="absolute inset-0 cursor-default" />
      <div className="relative my-8 w-full max-w-[520px] rounded-[28px] bg-white px-6 py-8 text-ink-950 sm:px-10 sm:py-10">
        <button aria-label="Close authentication form" onClick={onClose} className="absolute top-5 right-5 grid size-10 place-items-center rounded-xl border border-ink-950/15 text-ink-700 transition-colors hover:bg-ink-950/5 hover:text-ink-950">
          <X className="size-5" />
        </button>
        <div className="max-w-sm">
          <p className="text-eyebrow text-brand-600">InterviewNest</p>
          <h2 id="auth-modal-title" className="mt-4 text-3xl font-bold tracking-tight">{loginMode ? 'Welcome back!' : 'Create your account'}</h2>
          <p className="mt-2 text-base leading-relaxed text-ink-800">{loginMode ? 'Log in to continue your interview practice.' : 'Start practising with an interviewer that listens.'}</p>
        </div>
        <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-3.5">
          {!loginMode && <Field variant="light" icon={UserRound} label="Your full name" autoComplete="name" value={form.name} onChange={update('name')} error={errors.name} />}
          <Field variant="light" icon={Mail} label="Your username or email" type="email" autoComplete="email" value={form.email} onChange={update('email')} error={errors.email} />
          <Field variant="light" icon={Lock} label="Your password" type="password" autoComplete={loginMode ? 'current-password' : 'new-password'} value={form.password} onChange={update('password')} error={errors.password} />
          {loginMode && (
            <div className="flex items-center justify-between pt-1 text-base">
              <label className="flex cursor-pointer items-center gap-2 text-ink-800">
                <input type="checkbox" checked={form.remember} onChange={(event) => setForm((current) => ({ ...current, remember: event.target.checked }))} className="size-4 accent-brand-600" />
                Remember me
              </label>
              <button type="button" className="font-semibold text-brand-600 hover:text-brand-800">Forgot password?</button>
            </div>
          )}
          <Button type="submit" variant="ink" size="lg" className="mt-2 w-full text-base shadow-none" loading={submitting}>{loginMode ? 'Log in' : 'Create account'} {!submitting && <ArrowRight className="size-4" />}</Button>
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
        <div className="mt-3 grid grid-cols-2 gap-3 pt-2">
          <Button
            type="button"
            variant="light"
            size="lg"
            className="text-base ring-1 ring-ink-950/15 shadow-none"
            onClick={() => toast('LinkedIn sign-in will be available soon.')}
          >
            <LinkedInIcon className="size-[19px] text-[#0A66C2]" />
            LinkedIn
          </Button>
          <Button
            type="button"
            variant="light"
            size="lg"
            className="text-base ring-1 ring-ink-950/15 shadow-none"
            onClick={() => toast('GitHub sign-in will be available soon.')}
          >
            <GitHubIcon className="size-[19px] text-ink-950" />
            GitHub
          </Button>
        </div>
        <p className="mt-7 text-center text-base text-ink-800">
          {loginMode ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={() => onModeChange(loginMode ? 'signup' : 'login')} className="font-semibold text-brand-600 hover:text-brand-800">
            {loginMode ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}

function PracticeStoryImage({ side, src, eyebrow, title, className = '' }) {
  return (
    <div className={`group absolute hidden w-[230px] lg:block ${side === 'left' ? '-left-28 xl:-left-44' : '-right-28 xl:-right-44'} ${className}`}>
      <div className="relative">
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="hero-cutout relative z-10 h-[290px] w-full object-cover object-center transition duration-700 group-hover:scale-[1.04]"
        />
        <div className={`absolute top-1/2 z-20 w-max max-w-[150px] rounded-xl border border-white/70 bg-white/90 px-3 py-2 shadow-[0_15px_35px_-20px_rgba(36,20,54,0.7)] backdrop-blur-sm ${side === 'left' ? '-right-3' : '-left-3'}`}>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600">{eyebrow}</p>
          <p className="mt-1 text-xs font-bold leading-tight text-ink-950">{title}</p>
        </div>
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
    <div className="min-h-screen overflow-hidden bg-[#fbfaf8] text-ink-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[760px] bg-[radial-gradient(circle_at_50%_0%,rgba(197,169,255,0.26),transparent_62%)]" />

      <header className="relative z-20 mx-auto max-w-7xl px-5 pt-5 sm:px-8">
        <nav className="flex h-14 items-center justify-between rounded-2xl border border-ink-950/10 bg-white/75 px-3 shadow-[0_12px_35px_-25px_rgba(28,16,40,0.45)] backdrop-blur-xl sm:px-5">
          <Logo />
          <div className="hidden items-center gap-7 md:flex">
            <a href="#how-it-works" className="text-sm font-medium text-ink-700 hover:text-ink-950">How it works</a>
            <a href="#features" className="text-sm font-medium text-ink-700 hover:text-ink-950">Why InterviewNest</a>
            <a href="#stories" className="text-sm font-medium text-ink-700 hover:text-ink-950">Learner stories</a>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            {!user && <button type="button" onClick={() => setAuthMode('login')} className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 hover:text-ink-950">Sign in</button>}
            <Button variant="ink" size="sm" onClick={() => user ? navigate(primary.to) : setAuthMode('signup')}>{user ? 'Dashboard' : 'Get started'}</Button>
          </div>
          <button aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((open) => !open)} className="grid size-10 place-items-center rounded-lg text-ink-800 sm:hidden">
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>
        {menuOpen && (
          <div className="mt-2 rounded-2xl border border-ink-950/10 bg-white p-4 shadow-lg sm:hidden">
            <div className="grid gap-1">
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium">How it works</a>
              <a href="#features" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium">Why InterviewNest</a>
              <a href="#stories" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium">Learner stories</a>
              {!user && <button type="button" onClick={() => { setMenuOpen(false); setAuthMode('login'); }} className="rounded-lg px-3 py-2 text-left text-sm font-semibold">Sign in</button>}
              <Button variant="ink" size="sm" onClick={() => user ? navigate(primary.to) : setAuthMode('signup')}>{primary.label}</Button>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-5 pt-20 pb-24 text-center sm:px-8 sm:pt-28">
          <Stagger>
            <StaggerItem>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-white/80 px-4 py-2 text-xs font-semibold text-brand-700 shadow-sm">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.14)]" />
                Practice that sounds like the real thing
              </span>
            </StaggerItem>
            <StaggerItem>
              <h1 className="mx-auto mt-7 max-w-4xl text-[clamp(2.8rem,7vw,5.9rem)] font-extrabold leading-[0.95] tracking-[-0.065em]">
                Make your next answer<br /><span className="text-brand-600">your best one yet.</span>
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-ink-700 sm:text-xl">
                InterviewNest turns your experience into realistic AI mock interviews, useful follow-ups, and a clear plan for getting better.
              </p>
            </StaggerItem>
            <StaggerItem className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="ink" size="lg" onClick={() => user ? navigate(primary.to) : setAuthMode('signup')}>{primary.label} <ArrowRight className="size-4" /></Button>
              {!user && <button type="button" onClick={() => setAuthMode('login')} className="inline-flex items-center px-4 py-3 text-sm font-semibold text-ink-700 hover:text-ink-950">I already have an account</button>}
            </StaggerItem>
          </Stagger>

          <div className="relative mx-auto mt-16 max-w-3xl text-left sm:mt-20">
            <PracticeStoryImage
              side="left"
              src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=500&q=85"
              eyebrow="Real conversation"
              title="Ask better questions."
              className="top-10 -rotate-6"
            />
            <PracticeStoryImage
              side="right"
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=500&q=85"
              eyebrow="Your next rep"
              title="Show what you know."
              className="top-32 rotate-6"
            />
            <InterviewPreview />
            <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-ink-700/70">
              {['Resume-aware prompts', 'Voice or text answers', 'Evidence-backed feedback'].map((item) => <span key={item} className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-600" />{item}</span>)}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-8 border-t border-ink-950/10 px-5 py-20 sm:px-8">
          <Reveal><p className="text-eyebrow text-brand-600">A better rehearsal</p><h2 className="text-title mt-2 max-w-xl">Prepare with intention, not just repetition.</h2></Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ number, icon: Icon, title, text }, index) => <Reveal key={title} delay={index * 0.08}><article className="h-full rounded-2xl border border-ink-950/10 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(30,18,45,0.7)]"><div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-xl bg-ink-950 text-white"><Icon className="size-5" /></span><span className="text-eyebrow text-ink-950/30">{number}</span></div><h3 className="text-heading mt-6">{title}</h3><p className="text-body mt-2 text-ink-700">{text}</p></article></Reveal>)}
          </div>
        </section>

        <section id="features" className="scroll-mt-8 bg-ink-950 px-5 py-20 text-white sm:px-8">
          <div className="mx-auto max-w-7xl"><Reveal><p className="text-eyebrow text-brand-200">Built for the moment you get stuck</p><h2 className="text-title mt-2 max-w-2xl">Not another question generator.</h2></Reveal><div className="mt-10 grid gap-4 lg:grid-cols-3">{FEATURES.map(({ icon: Icon, title, text }, index) => <Reveal key={title} delay={index * 0.08}><article className="rounded-2xl border border-white/10 bg-white/[0.06] p-6"><span className="grid size-11 place-items-center rounded-xl bg-brand-500/20 text-brand-200"><Icon className="size-5" /></span><h3 className="text-heading mt-6">{title}</h3><p className="text-body mt-2 text-white/60">{text}</p></article></Reveal>)}</div></div>
        </section>

        <section id="stories" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-20 sm:px-8"><Reveal><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-eyebrow text-brand-600">From the practice room</p><h2 className="text-title mt-2 max-w-xl">Confidence sounds different for everyone.</h2></div><p className="max-w-xs text-sm leading-relaxed text-ink-700">Small, honest improvements compound into answers you can stand behind.</p></div></Reveal><div className="mt-10 grid gap-4 lg:grid-cols-3">{QUOTES.map(({ quote, name, role }, index) => <Reveal key={name} delay={index * 0.08}><blockquote className="flex h-full flex-col justify-between rounded-2xl border border-ink-950/10 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(30,18,45,0.7)]"><p className="text-lg font-semibold leading-snug tracking-tight">“{quote}”</p><footer className="mt-8 text-sm text-ink-700"><strong className="text-ink-950">{name}</strong><span className="mx-2 text-ink-950/30">·</span>{role}</footer></blockquote></Reveal>)}</div></section>

        <section className="mx-5 mb-20 overflow-hidden rounded-[28px] bg-brand-100 px-6 py-14 text-center sm:mx-auto sm:max-w-7xl sm:px-10"><ShieldCheck className="mx-auto size-8 text-brand-700" /><h2 className="text-title mx-auto mt-4 max-w-2xl">You do not need more confidence. You need one more good rehearsal.</h2><p className="mx-auto mt-3 max-w-lg text-ink-700">Start with a role, a resume, or just the question you keep avoiding.</p><Button variant="ink" size="lg" className="mt-7" onClick={() => user ? navigate(primary.to) : setAuthMode('signup')}>{primary.label} <ArrowRight className="size-4" /></Button></section>
      </main>

      <footer className="border-t border-ink-950/10 px-5 py-7 text-center text-xs text-ink-700/70">InterviewNest · Practice honestly. Interview confidently.</footer>
      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onModeChange={setAuthMode} />}
    </div>
  );
}
