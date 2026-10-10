import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

const VARIANTS = {
  light: 'bg-white text-ink-950 hover:bg-white/90 shadow-[0_14px_30px_-16px_rgba(72,45,124,0.58)] ring-1 ring-brand-200/80',
  brand: 'bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 text-white hover:brightness-[1.04] shadow-[0_18px_40px_-18px_rgba(92,62,228,0.9)]',
  dark: 'bg-ink-900/70 text-white border border-white/10 hover:bg-ink-800 hover:border-white/20',
  ghost: 'text-white/70 hover:text-white hover:bg-white/[0.06]',
  outline: 'border border-white/15 text-white hover:bg-white/[0.06]',
  danger: 'bg-red-500/90 text-white hover:bg-red-500',
  ink: 'bg-gradient-to-r from-ink-950 via-ink-900 to-ink-950 text-white hover:brightness-110 shadow-[0_18px_40px_-18px_rgba(10,8,15,0.95)] ring-1 ring-white/10',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-[15px] rounded-xl gap-2',
  icon: 'size-10 rounded-xl',
};

export function Button({ variant = 'brand', size = 'md', loading = false, disabled, className, children, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
