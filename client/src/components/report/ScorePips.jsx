import { motion } from '@/components/ui/motion';
import { cn } from '@/lib/utils';

// 1-5 rubric score as five pips that fill in one after another.
export function ScorePips({ score, className }) {
  return (
    <span className={cn('flex gap-0.5', className)} role="img" aria-label={`${score} out of 5`}>
      {[1, 2, 3, 4, 5].map((pip) => (
        <motion.span
          key={pip}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: pip * 0.05, duration: 0.25 }}
          className={cn('h-1.5 w-3 origin-left rounded-full', pip <= score ? 'bg-brand-400' : 'bg-white/10')}
        />
      ))}
    </span>
  );
}
