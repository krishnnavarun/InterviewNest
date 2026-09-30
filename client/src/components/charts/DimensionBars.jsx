import { cn } from '@/lib/utils';
import { EASE, motion } from '@/components/ui/motion';

// Horizontal bars for skill dimensions (0-100). One series -> one colour for
// every bar; values sit at the bar tip; each bar has its own hover/focus
// tooltip; <= 12px thick with a 4px rounded data end and a square baseline.
export function DimensionBars({ items, className }) {
  return (
    <ul className={cn('space-y-3.5', className)}>
      {items.map((item, index) => (
        <li key={item.id} className="grid grid-cols-[minmax(0,9.5rem)_1fr] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr]">
          <span className="truncate text-white/70" title={item.label}>
            {item.label}
          </span>
          <div className="flex items-center gap-2.5 border-l border-white/15">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.max(item.value, 1.5)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE, delay: index * 0.07 }}
              tabIndex={0}
              role="img"
              aria-label={`${item.label}: ${item.value} out of 100`}
              className="group relative h-3 cursor-default rounded-r-[4px] bg-brand-400 transition-[filter] outline-none hover:brightness-125 focus-visible:brightness-125"
            >
              <span className="pointer-events-none absolute bottom-full left-full z-10 mb-2 hidden -translate-x-1/2 rounded-lg border border-white/10 bg-ink-950 px-2.5 py-1.5 text-xs whitespace-nowrap shadow-xl group-hover:block group-focus-visible:block">
                <strong className="text-white">{item.value}</strong> <span className="text-white/55">{item.label}</span>
              </span>
            </motion.div>
            <span className="shrink-0 text-xs font-semibold text-white tabular-nums">{item.value}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
