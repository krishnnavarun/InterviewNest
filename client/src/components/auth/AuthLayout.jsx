import { Link } from 'react-router-dom';
import { BadgeCheck, Code2, MessagesSquare } from 'lucide-react';
import { RadialBackground } from '@/components/ui/light-theme-tailwind-css-background-snippet';

const HIGHLIGHTS = [
  {
    icon: MessagesSquare,
    title: 'Adapts to every answer',
    text: 'Follows up, digs deeper or gives a hint - like a real interviewer.',
  },
  {
    icon: BadgeCheck,
    title: 'Grades with evidence',
    text: 'Every score is backed by a quote from what you actually said.',
  },
  {
    icon: Code2,
    title: 'A real coding round',
    text: 'Your code runs against AI-generated, verified test cases.',
  },
];

export function Logo({ className = '' }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 font-bold tracking-tight ${className}`}>
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-b from-plum-700 to-ink-950 text-white shadow-lg shadow-brand-900/30">
        I
      </span>
      <span className="text-lg">InterviewNest</span>
    </Link>
  );
}

export function AuthLayout({ children }) {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <RadialBackground />

      <div className="grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1fr_440px]">
        <section className="hidden animate-fade-up text-ink-950 lg:block">
          <Logo />
          <h1 className="mt-10 max-w-lg text-5xl leading-[1.05] font-extrabold tracking-tight">
            Practise with an AI interviewer that actually <span className="text-brand-500">listens.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink-700">
            Upload your resume, pick a role, and get a realistic interview with an evidence-based feedback report.
          </p>
          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex max-w-md gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink-950 text-white shadow-lg shadow-brand-900/25">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-ink-700">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="mx-auto w-full max-w-[440px] animate-fade-up [animation-delay:80ms]">{children}</div>
      </div>
    </main>
  );
}

export function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="surface-dark rounded-3xl px-6 py-9 text-white sm:px-8">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-12 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-lg font-semibold">
          I
        </span>
        <h1 className="mt-4 text-[26px] font-bold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-white/60">{subtitle}</p>
      </div>
      <div className="mt-8">{children}</div>
      {footer && <p className="mt-8 text-center text-sm text-white/60">{footer}</p>}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-4 text-sm text-white/40" role="separator">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/15" />
      or
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/15" />
    </div>
  );
}

export function GoogleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M21.35 11.1h-9.17v2.98h5.3c-.23 1.4-1.63 4.12-5.3 4.12-3.19 0-5.8-2.64-5.8-5.9s2.61-5.9 5.8-5.9c1.82 0 3.04.78 3.73 1.44l2.54-2.45C16.84 3.9 14.73 3 12.18 3 7.02 3 2.85 7.03 2.85 12.3s4.17 9.3 9.33 9.3c5.39 0 8.96-3.79 8.96-9.13 0-.61-.06-1.08-.14-1.37z" />
    </svg>
  );
}
