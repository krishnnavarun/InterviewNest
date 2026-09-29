import { cn } from '@/lib/utils';

// Dark card used across the app. `tone="plum"` is the gradient auth-card look,
// `tone="ink"` is flatter for dense content.
export function Panel({ tone = 'ink', className, children, ...props }) {
  return (
    <section
      className={cn('rounded-2xl text-white', tone === 'plum' ? 'surface-dark' : 'surface-ink', className)}
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
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-white/55">{description}</p>}
      </div>
      {action}
    </div>
  );
}
