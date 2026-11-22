import { cn } from '@/lib/utils';

/**
 * Modern card panel. Defaults to a clean, crisp light card inspired by micro1.
 * Supports tone="dark" or tone="light".
 */
export function Panel({ tone = 'light', className, children, ...props }) {
  const isDark = tone === 'dark';
  return (
    <section
      className={cn(
        'rounded-2xl transition-all',
        isDark
          ? 'border border-zinc-800 bg-[#120e1d] text-white shadow-md'
          : 'border border-zinc-200/90 bg-white text-zinc-950 shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function PanelHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <h2 className="text-base font-bold tracking-tight text-inherit">{title}</h2>
        {description && <p className="mt-1 text-sm opacity-65">{description}</p>}
      </div>
      {action}
    </div>
  );
}
