import { cn } from '@/lib/utils';

// White -> violet radial backdrop. Place it inside a `relative isolate`
// container; pass `className="fixed"` to keep it still while the page scrolls.
export const RadialBackground = ({ className }) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-0 -z-10 size-full bg-white [background:radial-gradient(120%_110%_at_50%_0%,#ffffff_38%,#f6f2ff_63%,#c9b5ff_100%)]',
        className
      )}
    />
  );
};
