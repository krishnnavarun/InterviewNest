import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

const VARIANTS = {
  light: 'bg-white text-ink-950 hover:bg-white/90 shadow-[0_8px_24px_-12px_rgba(255,255,255,0.6)]',
  brand: 'bg-brand-500 text-white hover:bg-brand-600 shadow-[0_10px_30px_-12px_rgba(102,51,238,0.9)]',
  dark: 'bg-ink-900/70 text-white border border-white/10 hover:bg-ink-800 hover:border-white/20',
  ghost: 'text-white/70 hover:text-white hover:bg-white/[0.06]',
  outline: 'border border-white/15 text-white hover:bg-white/[0.06]',
  danger: 'bg-red-500/90 text-white hover:bg-red-500',
  ink: 'bg-ink-950 text-white hover:bg-ink-800 shadow-[0_10px_30px_-14px_rgba(11,9,16,0.9)]',
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
