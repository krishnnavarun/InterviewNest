import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

const VARIANTS = {
  light: 'bg-white text-zinc-950 hover:bg-zinc-50 border border-zinc-200 shadow-xs',
  brand: 'bg-zinc-950 text-white hover:bg-zinc-800 shadow-xs',
  dark: 'bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800',
  ghost: 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100',
  outline: 'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 shadow-xs',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ink: 'bg-zinc-950 text-white hover:bg-zinc-800 shadow-xs',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-11 px-5 text-sm font-semibold rounded-xl gap-2',
  icon: 'size-9 rounded-xl',
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
