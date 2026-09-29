import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TopicRail({ topics, currentIndex, done }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="Interview progress">
      {topics.map((topic, index) => {
        const complete = done || index < currentIndex;
        const current = !done && index === currentIndex;
        return (
          <li key={topic.id} className="flex items-center gap-1.5" title={topic.title}>
            <span
              aria-current={current ? 'step' : undefined}
              className={cn(
                'grid size-6 place-items-center rounded-full text-[11px] font-semibold transition-colors',
                complete && 'bg-white text-ink-950',
                current && 'bg-brand-500 text-white ring-4 ring-brand-500/25',
                !complete && !current && 'bg-white/10 text-white/50'
              )}
            >
              {complete ? <Check className="size-3.5" /> : index + 1}
            </span>
            {current && <span className="hidden max-w-40 truncate text-xs font-medium text-white/80 xl:inline">{topic.title}</span>}
            {index < topics.length - 1 && <span className={cn('h-px w-3 sm:w-5', complete ? 'bg-white/50' : 'bg-white/15')} />}
          </li>
        );
      })}
    </ol>
  );
}
