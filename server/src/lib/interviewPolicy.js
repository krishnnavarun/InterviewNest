// Deterministic guardrails around the LLM's decision.
//
// The model proposes the next action, but hard limits (follow-up caps, total
// turn budget, topic order) are enforced in code so a model mistake can never
// trap the candidate in an endless topic or end the interview too early.

const FOLLOW_UP_ACTIONS = new Set(['follow_up', 'probe_deeper', 'give_hint']);

/**
 * @param {object} state
 * @param {string} state.proposed        action proposed by the model
 * @param {number} state.topicIndex      index of the current topic
 * @param {number} state.topicCount      total number of topics
 * @param {number} state.followUpsUsed   follow-ups already asked on this topic
 * @param {number} state.maxFollowUps    follow-up cap for this topic
 * @param {number} state.candidateTurns  answers given so far (including this one)
 * @param {number} state.turnBudget      max answers for the whole interview
 * @returns {{ action: string, overridden: boolean, reason: string | null }}
 */
export function resolveNextAction({ proposed, topicIndex, topicCount, followUpsUsed, maxFollowUps, candidateTurns, turnBudget }) {
  const isLastTopic = topicIndex >= topicCount - 1;
  const moveOn = isLastTopic ? 'wrap_up' : 'next_topic';

  let action = proposed;
  let reason = null;

  if (candidateTurns >= turnBudget) {
    action = 'wrap_up';
    reason = 'turn_budget_reached';
  } else if (FOLLOW_UP_ACTIONS.has(proposed) && followUpsUsed >= maxFollowUps) {
    action = moveOn;
    reason = 'follow_up_limit_reached';
  } else if (proposed === 'next_topic' && isLastTopic) {
    action = 'wrap_up';
    reason = 'no_topics_left';
  } else if (proposed === 'wrap_up' && !isLastTopic) {
    action = 'next_topic';
    reason = 'topics_remaining';
  }

  return { action, overridden: action !== proposed, reason };
}

export const isFollowUpAction = (action) => FOLLOW_UP_ACTIONS.has(action);
