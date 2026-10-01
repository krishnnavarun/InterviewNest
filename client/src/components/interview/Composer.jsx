import { useEffect, useState } from 'react';
import { Keyboard, Mic, SendHorizontal, SkipForward, Square, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useRecorder } from '@/hooks/useRecorder';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

const SKIP_TEXT = "I'm not sure how to answer this one - could we move on?";

export function Composer({ disabled, busy, voiceInput = true, onVoiceAnswer, onTextAnswer, onStartRecording }) {
  const [mode, setMode] = useState(voiceInput ? 'voice' : 'text');
  // Speech-to-text is optional on the server; fall back to typing when it is off.
  useEffect(() => {
    if (!voiceInput) setMode('text');
  }, [voiceInput]);
  const [text, setText] = useState('');
  const recorder = useRecorder({
    maxSeconds: 180,
    onComplete: (blob, seconds) => {
      if (seconds < 1.5) return toast.error('That was very short - hold on and answer fully.');
      onVoiceAnswer(blob);
    },
  });

  const recording = recorder.status === 'recording';
  const locked = disabled || busy;

  const startRecording = async () => {
    try {
      onStartRecording?.();
      await recorder.start();
    } catch (error) {
      toast.error(error.message);
      setMode('text');
    }
  };

  const sendText = () => {
    const answer = text.trim();
    if (!answer) return;
    onTextAnswer(answer);
    setText('');
  };

  return (
    <div className="border-t border-white/[0.08] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        {!voiceInput ? (
          <p className="text-caption text-white/45">Voice answers are off on this server - type your answer below.</p>
        ) : (
        <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-1" role="tablist" aria-label="Answer mode">
          {[
            ...(voiceInput ? [{ id: 'voice', label: 'Speak', icon: Mic }] : []),
            { id: 'text', label: 'Type', icon: Keyboard },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={mode === id}
              disabled={recording}
              onClick={() => setMode(id)}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                mode === id ? 'bg-white text-ink-950' : 'text-white/60 hover:text-white'
              )}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
        )}
        <button
          onClick={() => onTextAnswer(SKIP_TEXT)}
          disabled={locked || recording}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white disabled:opacity-40"
        >
          <SkipForward className="size-3.5" /> Skip question
        </button>
      </div>

      {mode === 'voice' ? (
        <div className="flex items-center gap-4">
          {recording ? (
            <>
              <button
                onClick={recorder.stop}
                aria-label="Stop and submit answer"
                className="relative grid size-16 shrink-0 cursor-pointer place-items-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30"
              >
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-red-500/50" />
                <Square className="relative size-5 fill-current" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <span className="size-2 rounded-full bg-red-400" /> Recording {formatDuration(recorder.elapsed)}
                  <span className="text-white/35">/ {formatDuration(recorder.maxSeconds)}</span>
                </div>
                <div className="mt-2 flex h-6 items-end gap-[3px]" aria-hidden="true">
                  {Array.from({ length: 28 }, (_, i) => {
                    const wave = 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7 + recorder.elapsed * 6));
                    return (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-white/70 transition-[height] duration-75"
                        style={{ height: `${Math.max(12, recorder.level * wave * 100)}%` }}
                      />
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-white/40">Click the square when you finish your answer.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={recorder.cancel}>
                <X className="size-4" /> Discard
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={startRecording}
                disabled={locked || recorder.status === 'requesting'}
                aria-label="Start recording your answer"
                className="grid size-16 shrink-0 cursor-pointer place-items-center rounded-full bg-white text-ink-950 shadow-lg shadow-white/10 transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Mic className="size-6" />
              </button>
              <div>
                <p className="text-sm font-semibold text-white">{busy ? 'Natalie is thinking...' : 'Tap to answer out loud'}</p>
                <p className="text-xs text-white/45">Speak naturally. Up to 3 minutes per answer.</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-end gap-3">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) sendText();
              }}
              rows={3}
              maxLength={5000}
              disabled={locked}
              aria-describedby="composer-hint"
              placeholder="Type your answer..."
              className="min-h-20 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.05] p-3 text-sm text-white placeholder:text-white/35 focus:border-brand-300/50 focus:outline-none disabled:opacity-50"
            />
            <Button variant="light" size="icon" onClick={sendText} disabled={locked || !text.trim()} aria-label="Send answer">
              <SendHorizontal className="size-4" />
            </Button>
          </div>
          {/* Keyboard shortcut only matters with a physical keyboard. */}
          <p id="composer-hint" className="mt-1.5 hidden text-[11px] text-white/35 sm:block">
            <kbd className="font-sans">Ctrl</kbd> + <kbd className="font-sans">Enter</kbd> to send · {text.trim() ? text.trim().split(/\s+/).length : 0} words
          </p>
        </div>
      )}
    </div>
  );
}
