import { cn } from '@/lib/utils';

const TONES = {
  neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200/90',
  brand: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  amber: 'bg-amber-50 text-amber-800 border-amber-200/80',
  red: 'bg-rose-50 text-rose-700 border-rose-200/80',
};

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-2xs', TONES[tone], className)}>
      {children}
    </span>
  );
}
