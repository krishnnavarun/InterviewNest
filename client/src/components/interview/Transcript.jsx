import { useEffect, useRef } from 'react';
import { Code2, Keyboard, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EASE, motion } from '@/components/ui/motion';

function CandidateMeta({ turn }) {
  if (turn.inputMode === 'code') {
    return (
      <span className="flex items-center gap-1">
        <Code2 className="size-3" /> Code submission
      </span>
    );
  }
  if (turn.inputMode === 'voice') {
    const speech = turn.speech;
    return (
      <span className="flex items-center gap-1">
        <Mic className="size-3" /> Voice
        {speech?.wpm ? ` · ${speech.wpm} wpm` : ''}
        {speech?.fillerCount ? ` · ${speech.fillerCount} filler${speech.fillerCount === 1 ? '' : 's'}` : ''}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1">
      <Keyboard className="size-3" /> Typed
    </span>
  );
}

export function Transcript({ turns, pending, className }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns.length, pending]);

  return (
    <div className={cn('space-y-4 overflow-y-auto p-4 sm:p-6', className)} aria-live="polite">
      {turns.map((turn) =>
        turn.speaker === 'interviewer' ? (
          <motion.div
            key={turn.index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="flex max-w-[88%] gap-3"
          >
            <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-brand-400/60 to-plum-900 text-xs font-semibold">
              N
            </span>
            <div className="rounded-2xl rounded-tl-md border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-sm">
              {turn.text && <p className="leading-relaxed text-white/70">{turn.text}</p>}
              {turn.question && <p className={cn('leading-relaxed font-medium text-white', turn.text && 'mt-2')}>{turn.question}</p>}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={turn.index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="ml-auto flex max-w-[88%] flex-col items-end"
          >
            <div className="rounded-2xl rounded-tr-md bg-white px-4 py-3 text-sm leading-relaxed text-ink-950 shadow-lg shadow-black/20">
              {turn.text}
            </div>
            <span className="mt-1.5 text-[11px] text-white/40">
              <CandidateMeta turn={turn} />
            </span>
          </motion.div>
        )
      )}

      {pending && (
        <div className="flex gap-3" role="status">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-brand-400/60 to-plum-900 text-xs font-semibold">N</span>
          <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-sm text-white/60">
            <span className="flex gap-1">
              {[0, 1, 2].map((dot) => (
                <span key={dot} className="size-1.5 animate-bounce rounded-full bg-white/60" style={{ animationDelay: `${dot * 120}ms` }} />
              ))}
            </span>
            {pending}
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
