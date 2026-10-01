import { cn } from '@/lib/utils';

// White -> violet radial backdrop. Place it inside a `relative isolate`
// container; pass `className="fixed"` to keep it still while the page scrolls.
export const RadialBackground = ({ className }) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-0 -z-10 size-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)]',
        className
      )}
    />
  );
};
