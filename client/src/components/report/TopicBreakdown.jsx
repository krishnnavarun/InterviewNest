import { useState } from 'react';
import { BrainCircuit, ChevronDown, Quote, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ACTION_LABELS, DIMENSIONS, TOPIC_KIND_LABELS } from '@/constants/interview';
import { SCORE_TEXT, scoreTone } from '@/lib/format';
import { cn } from '@/lib/utils';

const NOTE_LABELS = {
  capped_no_evidence: 'capped at 3: no verifiable quote',
  capped_manipulation: 'capped: answer tried to instruct the grader',
};

function ScorePips({ score }) {
  return (
    <span className="flex gap-0.5" aria-label={`${score} out of 5`}>
      {[1, 2, 3, 4, 5].map((pip) => (
        <span key={pip} className={cn('h-1.5 w-3 rounded-full', pip <= score ? 'bg-brand-400' : 'bg-white/10')} />
      ))}
    </span>
  );
}

function TopicItem({ topic, turns, score, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const topicTurns = turns.filter((turn) => turn.topicId === topic.id);
  const finalEvaluation = [...topicTurns].reverse().find((turn) => turn.evaluation)?.evaluation;
  const covered = topicTurns.some((turn) => turn.speaker === 'candidate');

  return (
    <li className="rounded-2xl border border-white/[0.08] bg-white/[0.03]">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left sm:p-5"
      >
        <div className="min-w-0">
          <p className="text-xs text-white/45">{TOPIC_KIND_LABELS[topic.kind] ?? topic.kind}</p>
          <p className="truncate font-semibold">{topic.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {score !== undefined ? (
            <span className={cn('text-xl font-semibold tabular-nums', SCORE_TEXT[scoreTone(score)])}>{score}</span>
          ) : (
            <Badge>{covered ? 'Coding scored separately' : 'Not reached'}</Badge>
          )}
          <ChevronDown className={cn('size-4 text-white/50 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="space-y-5 border-t border-white/[0.06] p-4 sm:p-5">
          {topic.whyThisTopic && <p className="text-sm text-white/55">Why this topic: {topic.whyThisTopic}</p>}

          {finalEvaluation && (
            <div>
              <p className="text-sm text-white/80">{finalEvaluation.summary}</p>
              <ul className="mt-4 space-y-3">
                {finalEvaluation.criteria.map((criterion) => (
                  <li key={criterion.criterion} className="rounded-xl bg-black/20 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{criterion.criterion}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40">{DIMENSIONS[criterion.dimension]}</span>
                        <ScorePips score={criterion.score} />
                      </div>
                    </div>
                    {criterion.evidence && (
                      <p className="mt-2 flex gap-2 text-sm text-white/65 italic">
                        <Quote className="mt-0.5 size-3.5 shrink-0 text-brand-300" aria-hidden="true" />"{criterion.evidence}"
                      </p>
                    )}
                    {criterion.notes?.map((note) => (
                      <p key={note} className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-300/90">
                        <ShieldAlert className="size-3.5" /> Guardrail: {NOTE_LABELS[note] ?? note}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="mb-3 text-xs font-semibold tracking-wide text-white/45 uppercase">Conversation</p>
            <ol className="space-y-3">
              {topicTurns.map((turn) =>
                turn.speaker === 'interviewer' ? (
                  <li key={turn.index} className="text-sm">
                    <p className="text-white/85">
                      <span className="font-semibold text-brand-200">Natalie: </span>
                      {[turn.text, turn.question].filter(Boolean).join(' ')}
                    </p>
                    {turn.reasoning && turn.action !== 'greeting' && (
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-white/45">
                        <BrainCircuit className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          <span className="font-medium text-white/60">{ACTION_LABELS[turn.action] ?? turn.action}:</span> {turn.reasoning}
                          {turn.policyOverride && <span className="text-amber-300/80"> (guardrail adjusted: {turn.policyOverride})</span>}
                        </span>
                      </p>
                    )}
                  </li>
                ) : (
                  <li key={turn.index} className="rounded-xl bg-white/[0.05] p-3 text-sm text-white/80">
                    <span className="font-semibold text-white">You: </span>
                    {turn.text}
                  </li>
                )
              )}
            </ol>
          </div>
        </div>
      )}
    </li>
  );
}

export function TopicBreakdown({ topics, turns, topicScores }) {
  const scores = Object.fromEntries(topicScores.map((item) => [item.topicId, item.score]));
  return (
    <ul className="space-y-3">
      {topics.map((topic, index) => (
        <TopicItem key={topic.id} topic={topic} turns={turns} score={scores[topic.id]} defaultOpen={index === 0} />
      ))}
    </ul>
  );
}
