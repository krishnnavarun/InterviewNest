import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dark input with a leading icon, matching the auth card design.
export function Field({ icon: Icon, label, error, type = 'text', variant = 'dark', className, ...props }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const light = variant === 'light';

  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2',
              light ? 'text-brand-600' : 'text-white/45'
            )}
          />
        )}
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder={label}
          className={cn(
            'h-[52px] w-full rounded-xl border text-base transition-colors outline-none focus-visible:outline-none',
            light
              ? 'border-ink-950/20 bg-white text-ink-950 placeholder:text-ink-700/55 focus:border-brand-500 focus:bg-white'
              : 'border-white/[0.06] bg-white/[0.07] text-white placeholder:text-white/40 focus:border-brand-300/50 focus:bg-white/[0.1]',
            Icon ? 'pl-12' : 'pl-4',
            isPassword ? 'pr-12' : 'pr-4',
            error && 'border-red-400/60'
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className={cn(
              'absolute top-1/2 right-3 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg transition-colors',
              light ? 'text-ink-700/60 hover:text-ink-950' : 'text-white/45 hover:text-white/80'
            )}
          >
            {visible ? <Eye className="size-[18px]" /> : <EyeOff className="size-[18px]" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 pl-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
