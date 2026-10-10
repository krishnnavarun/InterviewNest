import { Link } from 'react-router-dom';
import { BadgeCheck, Code2, MessagesSquare } from 'lucide-react';
import { RadialBackground } from '@/components/ui/light-theme-tailwind-css-background-snippet';
import { EASE, motion } from '@/components/ui/motion';

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

export function AuthLayout({ children, headerAction }) {
  return (
    <main className="relative isolate min-h-screen overflow-hidden px-4 sm:px-6">
      <RadialBackground />

      <header className="fixed inset-x-0 top-0 z-20 h-[76px] border-b border-ink-950/[0.08] bg-white/80 px-5 backdrop-blur-xl sm:px-8 lg:px-12">
        <div className="flex h-full w-full items-center justify-between">
          <Logo />
          {headerAction && <div className="text-sm font-medium text-ink-700">{headerAction}</div>}
        </div>
      </header>

      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 pt-[76px] pb-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:px-10">
        <motion.section
          className="hidden text-ink-950 lg:block"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="text-display mt-10 max-w-lg">
            Practise with an AI interviewer that actually <span className="text-brand-500">listens.</span>
          </p>
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
        </motion.section>

        <motion.div
          className="mx-auto flex w-full max-w-[520px] items-center lg:ml-auto"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.08 }}
        >
          {children}
        </motion.div>
      </div>
    </main>
  );
}

export function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="surface-dark w-full rounded-[28px] px-7 py-10 text-white shadow-2xl shadow-plum-950/20 sm:px-10 sm:py-11">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-14 place-items-center rounded-2xl border border-white/15 bg-white/[0.08] text-xl font-semibold shadow-lg shadow-black/10">
          I
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-[15px] text-white/60">{subtitle}</p>
      </div>
      <div className="mt-9">{children}</div>
      {footer && <p className="mt-9 text-center text-sm text-white/60">{footer}</p>}
    </div>
  );
}

export function OrDivider({ light = false }) {
  return (
    <div className={`my-6 flex items-center gap-4 text-sm ${light ? 'text-ink-700/45' : 'text-white/40'}`} role="separator">
      <span className={`h-px flex-1 bg-gradient-to-r from-transparent ${light ? 'to-ink-950/15' : 'to-white/15'}`} />
      or
      <span className={`h-px flex-1 bg-gradient-to-l from-transparent ${light ? 'to-ink-950/15' : 'to-white/15'}`} />
    </div>
  );
}

export function GoogleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05h-9.17v3.88h5.25a4.49 4.49 0 0 1-1.95 2.95v2.43h3.15c1.84-1.69 2.9-4.18 2.9-7.21Z" />
      <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.15-2.43c-.87.58-1.98.92-3.3.92-2.54 0-4.69-1.72-5.46-4.03H3.28v2.51A9.74 9.74 0 0 0 12 21.75Z" />
      <path fill="#FBBC05" d="M6.54 13.85a5.86 5.86 0 0 1 0-3.7V7.64H3.28a9.76 9.76 0 0 0 0 8.72l3.26-2.51Z" />
      <path fill="#EA4335" d="M12 6.12c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.83 3.2 14.63 2.25 12 2.25a9.74 9.74 0 0 0-8.72 5.39l3.26 2.51c.77-2.31 2.92-4.03 5.46-4.03Z" />
    </svg>
  );
}

export function LinkedInIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M5.16 3.5a2.16 2.16 0 1 1 0 4.32 2.16 2.16 0 0 1 0-4.32ZM3.25 9.35h3.82V21H3.25V9.35Zm6.2 0h3.66v1.59h.05c.51-.97 1.76-1.99 3.63-1.99 3.88 0 4.6 2.55 4.6 5.86V21h-3.81v-5.48c0-1.31-.02-3-1.83-3-1.84 0-2.12 1.43-2.12 2.91V21H9.45V9.35Z" />
    </svg>
  );
}

export function GitHubIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 2.25a9.75 9.75 0 0 0-3.08 19c.49.09.67-.21.67-.47v-1.68c-2.72.59-3.29-1.15-3.29-1.15-.45-1.13-1.1-1.43-1.1-1.43-.89-.61.07-.6.07-.6.98.07 1.5 1 1.5 1 .88 1.5 2.3 1.07 2.86.82.09-.63.35-1.07.63-1.32-2.17-.25-4.45-1.09-4.45-4.85 0-1.07.38-1.94 1-2.62-.1-.25-.43-1.24.1-2.58 0 0 .82-.26 2.68 1a9.3 9.3 0 0 1 4.88 0c1.86-1.26 2.68-1 2.68-1 .53 1.34.2 2.33.1 2.58.62.68 1 1.55 1 2.62 0 3.77-2.29 4.6-4.47 4.84.35.31.67.92.67 1.86v2.76c0 .27.18.57.68.47A9.75 9.75 0 0 0 12 2.25Z" />
    </svg>
  );
}
