import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowUp, BookOpenCheck, FileText, MessagesSquare, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { PageSkeleton } from '@/components/ui/skeleton';
import { AnimatePresence, EASE, Page, motion } from '@/components/ui/motion';
import { coachingApi, progressApi } from '@/lib/services';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'interviewnest.coach.chat';
const SUGGESTIONS = [
  'What should I work on first?',
  'Summarise how my last interview went.',
  'Where did I lose the most points?',
  'How should I answer system design questions better?',
];

const loadChat = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
};

/** Renders plain text with "- " bullets and [n] citations as chips. */
function CoachText({ text, onCite }) {
  const renderInline = (line) =>
    line.split(/(\[\d+(?:\s*,\s*\d+)*\])/g).map((part, index) => {
      const match = part.match(/^\[(\d+(?:\s*,\s*\d+)*)\]$/);
      if (!match) return <Fragment key={index}>{part}</Fragment>;
      return match[1].split(',').map((number) => (
        <button
          key={`${index}-${number}`}
          onClick={() => onCite(Number(number))}
          className="mx-0.5 inline-grid h-5 min-w-5 cursor-pointer place-items-center rounded-md bg-brand-500/25 px-1 align-text-top text-[11px] font-semibold text-brand-100 hover:bg-brand-500/45"
          aria-label={`Source ${number.trim()}`}
        >
          {number.trim()}
        </button>
      ));
    });

  const blocks = text.split(/\n{2,}/);
  return (
    <div className="text-body space-y-3">
      {blocks.map((block, index) => {
        const lines = block.split('\n').filter(Boolean);
        if (lines.every((line) => /^\s*[-*•]\s+/.test(line))) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInline(line.replace(/^\s*[-*•]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{renderInline(lines.join(' '))}</p>;
      })}
    </div>
  );
}

/** "Full Stack Developer (Starter) interview on 2026-09-30 - Performance" -> title + context. */
function splitLabel(label = '') {
  const cut = label.indexOf(' - ');
  if (cut === -1) return { title: label, context: '' };
  return { title: label.slice(cut + 3), context: label.slice(0, cut) };
}

function SourceCard({ source, highlight }) {
  const { title, context } = splitLabel(source.label);
  // The stored excerpt repeats the context line; drop it so the preview adds information.
  const excerpt = context && source.excerpt?.startsWith(context) ? source.excerpt.slice(context.length).replace(/^[.\s]+/, '') : source.excerpt;
  return (
    <li
      id={`source-${source.number}`}
      className={cn(
        'rounded-xl border p-3 transition-colors',
        highlight === source.number ? 'border-brand-300/70 bg-brand-500/15' : 'border-white/15 bg-white/[0.05]'
      )}
    >
      <Link to={`/interview/${source.interviewId}/report`} className="group block">
        <p className="text-caption flex items-center gap-2 font-semibold text-white/85">
          <span className="grid size-5 shrink-0 place-items-center rounded-md bg-white/10 text-[11px]">{source.number}</span>
          <span className="truncate group-hover:underline">{title.charAt(0).toUpperCase() + title.slice(1)}</span>
        </p>
        {context && <p className="text-caption mt-0.5 truncate pl-7 text-white/40">{context}</p>}
        {excerpt && <p className="text-caption mt-1.5 line-clamp-2 text-white/55">{excerpt}</p>}
      </Link>
    </li>
  );
}

function Sources({ sources, highlight }) {
  const [showAll, setShowAll] = useState(false);
  if (!sources?.length) return null;
  const cited = sources.filter((source) => source.cited);
  // Show what the answer actually relied on; other retrieved passages stay one click away.
  const primary = cited.length ? cited : sources;
  const extra = sources.filter((source) => !primary.includes(source));
  const visible = showAll ? [...primary, ...extra] : primary;
  return (
    <div className="mt-4">
      <p className="text-eyebrow mb-2 text-white/40">{cited.length ? 'Cited from your interviews' : 'Retrieved from your interviews'}</p>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 [&>li]:min-w-0">
        {visible.map((source) => (
          <SourceCard key={source.number} source={source} highlight={highlight} />
        ))}
      </ul>
      {extra.length > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="text-caption mt-2 cursor-pointer text-white/45 hover:text-white"
        >
          {showAll ? 'Hide other retrieved passages' : `+${extra.length} more retrieved but not cited`}
        </button>
      )}
    </div>
  );
}

export default function CoachPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(loadChat);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    progressApi
      .get()
      .then((progress) => setCompleted(progress.stats.completed))
      .catch(() => setCompleted(0));
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    } catch {
      /* storage unavailable */
    }
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  const ask = async (question) => {
    const text = question.trim();
    if (!text || busy) return;
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: 'user', content: text }]);
    setInput('');
    setBusy(true);
    try {
      const result = await coachingApi.askCoach(text, history);
      setMessages((current) => [...current, { role: 'coach', content: result.answer, sources: result.sources, followUps: result.followUps }]);
    } catch (error) {
      toast.error(errorMessage(error));
      setMessages((current) => current.slice(0, -1));
      setInput(text);
    } finally {
      setBusy(false);
    }
  };

  const cite = (number) => {
    setHighlight(number);
    document.getElementById(`source-${number}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => setHighlight(null), 1600);
  };

  if (completed === null) return <PageSkeleton label="Loading your coach..." />;

  return (
    <Page className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-brand-600">AI Coach</p>
          <h1 className="text-title mt-1">Ask about your progress</h1>
          <p className="text-body mt-1 text-ink-700">Answers are retrieved from your own interviews and cite their sources.</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" className="text-ink-700 hover:bg-ink-950/5 hover:text-ink-950" onClick={() => setMessages([])}>
            <RotateCcw className="size-3.5" /> New chat
          </Button>
        )}
      </div>

      <Panel className="flex min-h-[560px] flex-col overflow-hidden">
        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6" aria-live="polite">
          {messages.length === 0 && (
            <div className="grid h-full min-h-80 place-items-center text-center">
              <div className="max-w-md">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-ink-950">
                  <MessagesSquare className="size-6" />
                </span>
                <p className="text-heading mt-5">Your coach knows your interviews</p>
                <p className="text-body mt-1.5 text-white/55">
                  {completed > 0
                    ? `It has read ${completed} completed interview${completed === 1 ? '' : 's'} - your answers, scores and feedback.`
                    : 'Complete an interview first so the coach has something to learn from.'}
                </p>
                {completed === 0 && (
                  <Button variant="light" className="mt-5" onClick={() => navigate('/interview/new')}>
                    Start an interview
                  </Button>
                )}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message, index) =>
              message.role === 'user' ? (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-white px-4 py-3 text-sm text-ink-950"
                >
                  {message.content}
                </motion.div>
              ) : (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="flex gap-3"
                >
                  <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-brand-400/60 to-plum-900">
                    <Sparkles className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-white/85">
                    <CoachText text={message.content} onCite={cite} />
                    <Sources sources={message.sources} highlight={index === messages.length - 1 ? highlight : null} />
                    {index === messages.length - 1 && message.followUps?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {message.followUps.map((followUp) => (
                          <button
                            key={followUp}
                            onClick={() => ask(followUp)}
                            className="cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-caption text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white"
                          >
                            {followUp}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>

          {busy && (
            <div className="flex items-center gap-3 text-sm text-white/55" role="status">
              <span className="grid size-8 place-items-center rounded-full bg-gradient-to-b from-brand-400/60 to-plum-900">
                <BookOpenCheck className="size-4" />
              </span>
              <span className="flex gap-1">
                {[0, 1, 2].map((dot) => (
                  <span key={dot} className="size-1.5 animate-bounce rounded-full bg-white/60" style={{ animationDelay: `${dot * 120}ms` }} />
                ))}
              </span>
              Searching your interviews...
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-white/[0.08] p-4 sm:p-5">
          {messages.length === 0 && completed > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => ask(suggestion)}
                  className="cursor-pointer rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-caption text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask(input);
            }}
            className="flex items-end gap-3"
          >
            <label htmlFor="coach-input" className="sr-only">
              Ask your coach
            </label>
            <textarea
              id="coach-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  ask(input);
                }
              }}
              rows={1}
              maxLength={1000}
              placeholder="Ask your coach..."
              className="text-body max-h-40 min-h-12 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white placeholder:text-white/35 focus:border-brand-300/50 focus:outline-none"
            />
            <Button type="submit" variant="light" size="icon" aria-label="Send" disabled={busy || !input.trim()}>
              <ArrowUp className="size-4" />
            </Button>
          </form>
          <p className="text-caption mt-2 flex items-center gap-1.5 text-white/35">
            <FileText className="size-3" /> The coach only uses your interview data and says so when it doesn&apos;t know.
          </p>
        </div>
      </Panel>
    </Page>
  );
}
