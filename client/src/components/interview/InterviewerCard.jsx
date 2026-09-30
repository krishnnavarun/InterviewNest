import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const STATUS = {
  speaking: { label: 'Speaking', dot: 'bg-brand-300' },
  listening: { label: 'Your turn', dot: 'bg-emerald-400' },
  recording: { label: 'Listening to you', dot: 'bg-red-400' },
  thinking: { label: 'Thinking', dot: 'bg-amber-300' },
  coding: { label: 'Waiting for your code', dot: 'bg-sky-300' },
  finishing: { label: 'Writing your report', dot: 'bg-amber-300' },
};

export function InterviewerCard({ status, turn, voiceOn, onToggleVoice, onReplay, blocked, onResume, compact = false }) {
  const info = STATUS[status] ?? STATUS.listening;
  const animated = status === 'speaking';

  return (
    <div className={cn('surface-dark rounded-3xl text-white', compact ? 'flex items-center gap-4 p-4' : 'p-6')}>
      <div className={cn('flex items-center gap-4', !compact && 'flex-col text-center')}>
        <span className={cn('relative grid shrink-0 place-items-center', compact ? 'size-12' : 'size-24')}>
          {animated && (
            <>
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-400/40" />
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-400/30 [animation-delay:0.5s]" />
            </>
          )}
          <span
            className={cn(
              'relative grid size-full place-items-center rounded-full border border-white/15 bg-gradient-to-b from-brand-400/60 to-plum-900 font-semibold',
              compact ? 'text-lg' : 'text-3xl'
            )}
          >
            N
          </span>
        </span>
        <div>
          <p className={cn('font-semibold', !compact && 'text-lg')}>Natalie</p>
          <p className="text-xs text-white/50">AI Interviewer</p>
          <p className={cn('mt-2 inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-medium', compact && 'mt-1')} aria-live="polite">
            {status === 'thinking' || status === 'finishing' ? <Spinner className="size-3" /> : <span className={cn('size-2 rounded-full', info.dot)} />}
            {info.label}
          </p>
        </div>
      </div>

      {!compact && turn && (
        <div className="mt-6 space-y-3">
          {turn.text && <p className="line-clamp-3 text-sm leading-relaxed text-white/60">{turn.text}</p>}
          {turn.question && (
            <p key={turn.question} className="animate-fade-up text-lg leading-snug font-semibold">
              {turn.question}
            </p>
          )}
        </div>
      )}
      {compact && turn?.question && <p className="min-w-0 flex-1 text-sm font-medium text-white/85">{turn.question}</p>}

      <div className={cn('flex items-center gap-2', compact ? 'ml-auto' : 'mt-6 justify-center')}>
        {blocked ? (
          <button
            onClick={onResume}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-ink-950"
          >
            <Play className="size-4" /> Play question
          </button>
        ) : (
          <button
            onClick={onReplay}
            disabled={!voiceOn || !turn}
            aria-label="Replay question"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
          >
            <RotateCcw className="size-4" /> {!compact && 'Replay'}
          </button>
        )}
        <button
          onClick={onToggleVoice}
          // A toggle keeps one stable name; aria-pressed announces on/off.
          aria-pressed={voiceOn}
          aria-label={compact ? 'Interviewer voice' : undefined}
          title={voiceOn ? 'Mute the interviewer' : 'Let the interviewer speak'}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white aria-pressed:text-white"
        >
          {voiceOn ? <Volume2 className="size-4" aria-hidden="true" /> : <VolumeX className="size-4" aria-hidden="true" />}
          {!compact && 'Voice'}
        </button>
      </div>
    </div>
  );
}
