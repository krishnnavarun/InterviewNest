// Motion primitives. All animation respects the OS "reduce motion" setting via
// <MotionConfig reducedMotion="user"> in main.jsx.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// `m` is Motion's lightweight component; its animation features are loaded
// lazily by <LazyMotion> in main.jsx, keeping them out of the initial bundle.
import { animate, AnimatePresence, m as motion, useInView } from 'motion/react';

export const EASE = [0.22, 1, 0.36, 1];

/** Page entrance: short fade + rise. Ends with no transform, so it never traps overlays. */
export function Page({ children, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Children reveal one after another. Use <StaggerItem> for each child. */
export function Stagger({ children, className, delay = 0, step = 0.06, as = 'div' }) {
  const Component = motion[as] ?? motion.div;
  return (
    <Component
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: step, delayChildren: delay } } }}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({ children, className, as = 'div', ...props }) {
  const Component = motion[as] ?? motion.div;
  return (
    <Component
      className={className}
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } }}
      {...props}
    >
      {children}
    </Component>
  );
}

/** Fades in when scrolled into view (used on long pages such as the report and landing page). */
export function Reveal({ children, className, delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Counts up to `value` once visible. */
export function AnimatedNumber({ value, duration = 1.1, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView || typeof value !== 'number') return undefined;
    const controls = animate(0, value, { duration, ease: EASE, onUpdate: (latest) => setDisplay(Math.round(latest)) });
    return () => controls.stop();
  }, [inView, value, duration]);
  return (
    <span ref={ref} className={className}>
      {/* Screen readers get the final value, not the in-between frames. */}
      <span aria-hidden="true">{typeof value === 'number' ? display : value}</span>
      <span className="sr-only">{value}</span>
    </span>
  );
}

/** Height-animated disclosure for accordions. */
export function Collapse({ open, children }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Full-screen overlay rendered into <body>, so no parent stacking context can hide it. */
export function Overlay({ open, children, label }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className="fixed inset-0 z-[100] grid place-items-center bg-ink-950/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export { AnimatePresence, motion };
