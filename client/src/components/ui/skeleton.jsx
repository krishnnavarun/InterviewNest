import { cn } from '@/lib/utils';

// Shimmering placeholder shown while content loads (keeps layout stable).
export function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-xl bg-[linear-gradient(90deg,rgb(255_255_255/0.05),rgb(255_255_255/0.1),rgb(255_255_255/0.05))]',
        className
      )}
    />
  );
}

export function PageSkeleton({ label = 'Loading...' }) {
  return (
    <div role="status" aria-label={label} className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded-full bg-ink-950/10" />
        <div className="h-9 w-72 max-w-full animate-pulse rounded-xl bg-ink-950/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="surface-ink rounded-2xl p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="surface-ink rounded-2xl p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
