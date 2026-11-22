import { cn } from '@/lib/utils';
import { EASE, motion } from '@/components/ui/motion';

// Horizontal bars for skill dimensions (0-100).
export function DimensionBars({ items, dark = false, className }) {
  return (
    <ul className={cn('space-y-3.5', className)}>
      {items.map((item, index) => (
        <li key={item.id} className="grid grid-cols-[minmax(0,9.5rem)_1fr] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr]">
          <span className={cn('truncate font-medium', dark ? 'text-white/70' : 'text-zinc-600')} title={item.label}>
            {item.label}
          </span>
          <div className={cn('flex items-center gap-2.5 border-l', dark ? 'border-white/15' : 'border-zinc-200')}>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.max(item.value, 1.5)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE, delay: index * 0.07 }}
              tabIndex={0}
              role="img"
              aria-label={`${item.label}: ${item.value} out of 100`}
              className="group relative h-3 cursor-default rounded-r-md bg-emerald-500 transition-[filter] outline-none hover:brightness-110 focus-visible:brightness-110"
            >
              <span
                className={cn(
                  'pointer-events-none absolute bottom-full left-full z-10 mb-2 hidden -translate-x-1/2 rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap shadow-xl group-hover:block group-focus-visible:block',
                  dark ? 'border border-white/10 bg-zinc-950 text-white' : 'border border-zinc-200 bg-white text-zinc-950'
                )}
              >
                <strong className={dark ? 'text-white' : 'text-zinc-950'}>{item.value}</strong>{' '}
                <span className={dark ? 'text-white/55' : 'text-zinc-500'}>{item.label}</span>
              </span>
            </motion.div>
            <span className={cn('shrink-0 text-xs font-semibold tabular-nums', dark ? 'text-white' : 'text-zinc-900')}>
              {item.value}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}