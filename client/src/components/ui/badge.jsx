import { cn } from '@/lib/utils';

const TONES = {
  neutral: 'bg-white/[0.08] text-white/75 border-white/10',
  brand: 'bg-brand-500/20 text-brand-200 border-brand-400/30',
  green: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-400/25',
  red: 'bg-red-500/15 text-red-300 border-red-400/25',
};

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', TONES[tone], className)}>
      {children}
    </span>
  );
}
