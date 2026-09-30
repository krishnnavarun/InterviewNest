import { useState } from 'react';
import toast from 'react-hot-toast';
import { BrainCircuit, ChevronDown, ListChecks, Quote, ShieldAlert, ShieldCheck, Target, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Collapse, EASE, motion } from '@/components/ui/motion';
import { ScorePips } from '@/components/report/ScorePips';
import { ACTION_LABELS, DIMENSIONS, TOPIC_KIND_LABELS } from '@/constants/interview';
import { coachingApi } from '@/lib/services';
import { errorMessage } from '@/lib/api';
import { SCORE_TEXT, scoreTone } from '@/lib/format';
import { cn } from '@/lib/utils';

const NOTE_LABELS = {
  capped_no_evidence: 'capped at 3: no verifiable quote',
  capped_manipulation: 'capped: answer tried to instruct the grader',
};

/**
 * The rewrite, with sentences the candidate never said underlined so they are
 * not presented as the candidate's own facts.
 */
function ImprovedAnswer({ text, unsupported = [] }) {
  const flagged = new Set(unsupported.map((sentence) => sentence.trim()));
  // Same splitter as the server's fact guard: "Node.js" does not end a sentence.
  const sentences = text.match(/(?:[^.!?]|[.!?](?=\S))+(?:[.!?]+|$)\s*/g) ?? [text];
  return sentences.map((sentence, index) =>
    flagged.has(sentence.trim()) ? (
      <span
        key={index}
        title="Not in your answer - only say this if it is true for you"
        className="underline decoration-amber-300/70 decoration-dotted underline-offset-4"
      >
        <WithPlaceholders text={sentence} />
      </span>
    ) : (
      <WithPlaceholders key={index} text={sentence} />
    )
  );
}

/** Highlights [placeholders] the candidate should fill in with their own facts. */
function WithPlaceholders({ text }) {
  return text.split(/(\[[^\]]+\])/g).map((part, index) =>
    /^\[[^\]]+\]$/.test(part) ? (
      <mark key={index} className="rounded bg-amber-400/20 px-1 text-amber-200">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function AnswerCoach({ interviewId, topicId, initial }) {
  const [coach, setCoach] = useState(initial ?? null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCoach(await coachingApi.coachTopic(interviewId, topicId));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (!coach) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-400/25 bg-brand-500/10 p-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Wand2 className="size-4 text-brand-200" /> Answer coach
          </p>
          <p className="text-caption mt-0.5 text-white/55">See your own answer rewritten to score higher, with anything you did not say clearly marked.</p>
        </div>
        <Button variant="light" size="sm" onClick={load} loading={loading}>
          {loading ? 'Coaching...' : 'Coach me on this answer'}
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="space-y-4 rounded-2xl border border-brand-400/25 bg-brand-500/[0.08] p-4 sm:p-5"
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Wand2 className="size-4 text-brand-200" /> Answer coach
      </p>
      <p className="text-body text-white/75">{coach.verdict}</p>

      {coach.missedPoints.length > 0 && (
        <div>
          <p className="text-eyebrow mb-2 flex items-center gap-1.5 text-white/45">
            <Target className="size-3.5" /> What you missed
          </p>
          <ul className="space-y-1.5">
            {coach.missedPoints.map((item) => (
              <li key={item.point} className="text-sm">
                <span className="font-medium text-white">{item.point}</span> <span className="text-white/55">- {item.why}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-eyebrow mb-2 text-white/45">Your answer, improved</p>
        <blockquote className="text-body rounded-xl border-l-2 border-brand-300 bg-black/20 p-4 text-white/85">
          <ImprovedAnswer text={coach.improvedAnswer} unsupported={coach.unsupportedSentences} />
        </blockquote>
        <ul className="text-caption mt-2 space-y-1 text-white/45">
          <li className="flex items-start gap-1.5">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
            <span>
              Fact guard checked this against your answer and resume.
              {coach.guardedNumbers?.length > 0 && ` ${coach.guardedNumbers.length} number(s) you never said became [metric].`}
            </span>
          </li>
          {/\[[^\]]+\]/.test(coach.improvedAnswer) && (
            <li className="pl-5">
              <mark className="rounded bg-amber-400/20 px-1 text-amber-200">[Highlighted]</mark> parts are yours to fill in with real details.
            </li>
          )}
          {coach.unsupportedSentences?.length > 0 && (
            <li className="pl-5">
              <span className="underline decoration-amber-300/70 decoration-dotted underline-offset-4">Underlined</span> lines go beyond what you
              said - only use them if they are true for you.
            </li>
          )}
        </ul>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-eyebrow mb-2 flex items-center gap-1.5 text-white/45">
            <ListChecks className="size-3.5" /> A strong answer covers
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-white/75">
            {coach.strongAnswerOutline.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl bg-black/20 p-3">
          <p className="text-eyebrow text-white/45">Practise this</p>
          <p className="mt-1.5 text-sm text-white/75">{coach.practiceTip}</p>
        </div>
      </div>
    </motion.div>
  );
}

function TopicItem({ interviewId, topic, turns, score, coaching, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const topicTurns = turns.filter((turn) => turn.topicId === topic.id);
  const finalEvaluation = [...topicTurns].reverse().find((turn) => turn.evaluation)?.evaluation;
  const covered = topicTurns.some((turn) => turn.speaker === 'candidate');
  const hasSpokenAnswer = topicTurns.some((turn) => turn.speaker === 'candidate' && turn.inputMode !== 'code');

  return (
    <li className="rounded-2xl border border-white/[0.08] bg-white/[0.03]">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-white/[0.02] sm:p-5"
      >
        <div className="min-w-0">
          <p className="text-caption text-white/45">{TOPIC_KIND_LABELS[topic.kind] ?? topic.kind}</p>
          <p className="truncate font-semibold">{topic.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {score !== undefined ? (
            <span className={cn('text-xl font-semibold tabular-nums', SCORE_TEXT[scoreTone(score)])}>{score}</span>
          ) : (
            <Badge>{covered ? 'Scored in coding round' : 'Not reached'}</Badge>
          )}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown className="size-4 text-white/50" />
          </motion.span>
        </div>
      </button>

      <Collapse open={open}>
        <div className="space-y-5 border-t border-white/[0.06] p-4 sm:p-5">
          {topic.whyThisTopic && <p className="text-sm text-white/55">Why this topic: {topic.whyThisTopic}</p>}

          {finalEvaluation && (
            <div>
              <p className="text-body text-white/80">{finalEvaluation.summary}</p>
              <ul className="mt-4 space-y-3">
                {finalEvaluation.criteria.map((criterion) => (
                  <li key={criterion.criterion} className="rounded-xl bg-black/20 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{criterion.criterion}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-caption text-white/40">{DIMENSIONS[criterion.dimension]}</span>
                        <ScorePips score={criterion.score} />
                      </div>
                    </div>
                    {criterion.evidence && (
                      <p className="mt-2 flex gap-2 text-sm text-white/65 italic">
                        <Quote className="mt-0.5 size-3.5 shrink-0 text-brand-300" aria-hidden="true" />"{criterion.evidence}"
                      </p>
                    )}
                    {criterion.notes?.map((note) => (
                      <p key={note} className="text-caption mt-1.5 flex items-center gap-1.5 text-amber-300/90">
                        <ShieldAlert className="size-3.5" /> Guardrail: {NOTE_LABELS[note] ?? note}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-eyebrow mb-3 text-white/45">Conversation</p>
            <ol className="space-y-3">
              {topicTurns.map((turn) => {
                if (turn.speaker === 'interviewer') {
                  return (
                    <li key={turn.index} className="text-sm">
                      <p className="text-white/85">
                        <span className="font-semibold text-brand-200">Natalie: </span>
                        {[turn.text, turn.question].filter(Boolean).join(' ')}
                      </p>
                    </li>
                  );
                }
                // The interviewer's decision after this answer explains what she did with it,
                // even when that decision moved the interview on to the next topic.
                const decision = turns.find((next) => next.index > turn.index && next.speaker === 'interviewer');
                return (
                  <li key={turn.index} className="space-y-1.5">
                    <p className="rounded-xl bg-white/[0.05] p-3 text-sm text-white/80">
                      <span className="font-semibold text-white">You: </span>
                      {turn.text}
                    </p>
                    {decision?.reasoning && (
                      <p className="text-caption flex items-start gap-1.5 px-1 text-white/45">
                        <BrainCircuit className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          <span className="font-medium text-white/60">{ACTION_LABELS[decision.action] ?? decision.action}:</span> {decision.reasoning}
                          {decision.policyOverride && <span className="text-amber-300/80"> (guardrail adjusted: {decision.policyOverride})</span>}
                        </span>
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          {finalEvaluation && hasSpokenAnswer && <AnswerCoach interviewId={interviewId} topicId={topic.id} initial={coaching?.[topic.id]} />}
        </div>
      </Collapse>
    </li>
  );
}

export function TopicBreakdown({ interviewId, topics, turns, topicScores, coaching }) {
  const scores = Object.fromEntries(topicScores.map((item) => [item.topicId, item.score]));
  // Open the weakest answered topic first - that is where coaching helps most.
  const weakest = [...topicScores].sort((a, b) => a.score - b.score)[0]?.topicId ?? topics[0]?.id;
  return (
    <ul className="space-y-3">
      {topics.map((topic) => (
        <TopicItem
          key={topic.id}
          interviewId={interviewId}
          topic={topic}
          turns={turns}
          score={scores[topic.id]}
          coaching={coaching}
          defaultOpen={topic.id === weakest}
        />
      ))}
    </ul>
  );
}
