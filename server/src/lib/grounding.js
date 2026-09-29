// Evidence grounding: an LLM grader must justify each score with a verbatim
// quote from the candidate. We verify the quote really exists in what the
// candidate said. Unverifiable quotes are dropped and high scores that rely
// on them are capped - so a hallucinated quote cannot inflate a score.

const normalize = (text) =>
  String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * True if `quote` appears in `source`, allowing small differences caused by
 * punctuation or speech-to-text (>= 80% of words match in the best window).
 * Graders often stitch verbatim fragments together with "..."; each fragment
 * must then be found on its own, so one invented fragment fails the quote.
 */
export function isGrounded(quote, source, minRatio = 0.8) {
  const sourceText = normalize(source);
  const fragments = String(quote ?? '')
    .split(/\.{3,}|…/)
    .map(normalize)
    .filter(Boolean);
  if (!sourceText || fragments.length === 0) return false;
  return fragments.every((fragment) => isFragmentGrounded(fragment, sourceText, minRatio));
}

function isFragmentGrounded(quoteText, sourceText, minRatio) {
  if (sourceText.includes(quoteText)) return true;

  const quoteWords = quoteText.split(' ');
  const sourceWords = sourceText.split(' ');
  if (quoteWords.length < 4 || sourceWords.length < quoteWords.length) return false;

  const windowSize = quoteWords.length;
  let best = 0;
  for (let start = 0; start + windowSize <= sourceWords.length; start++) {
    const remaining = new Map();
    for (let i = start; i < start + windowSize; i++) {
      remaining.set(sourceWords[i], (remaining.get(sourceWords[i]) ?? 0) + 1);
    }
    let matches = 0;
    for (const word of quoteWords) {
      const count = remaining.get(word) ?? 0;
      if (count > 0) {
        matches += 1;
        remaining.set(word, count - 1);
      }
    }
    best = Math.max(best, matches / windowSize);
    if (best >= minRatio) return true;
  }
  return false;
}

/**
 * Clean up a raw LLM evaluation for one topic:
 *  - map each criterion back to the rubric (so it has a dimension),
 *  - verify evidence quotes against the candidate's own words,
 *  - cap unsupported high scores at 3 and manipulation attempts at 2.
 */
export function sanitizeEvaluation(evaluation, rubric, candidateText) {
  const byName = new Map(rubric.map((item) => [normalize(item.criterion), item]));
  const hasAnswer = normalize(candidateText).length > 0;

  const criteria = rubric.map((item, index) => {
    const raw =
      evaluation.criteria.find((entry) => byName.get(normalize(entry.criterion)) === item) ??
      evaluation.criteria[index];

    let score = clampScore(raw?.score ?? 1);
    const quote = raw?.evidence?.trim() ?? '';
    const grounded = quote.length > 0 && isGrounded(quote, candidateText);
    const notes = [];

    if (!hasAnswer) score = 1;
    if (score >= 4 && !grounded) {
      score = 3;
      notes.push('capped_no_evidence');
    }
    if (evaluation.manipulationAttempt && score > 2) {
      score = 2;
      notes.push('capped_manipulation');
    }

    return {
      criterion: item.criterion,
      dimension: item.dimension,
      score,
      evidence: grounded ? quote : '',
      evidenceRejected: quote.length > 0 && !grounded,
      notes,
    };
  });

  return {
    answerQuality: evaluation.answerQuality,
    summary: evaluation.summary,
    manipulationAttempt: Boolean(evaluation.manipulationAttempt),
    criteria,
  };
}

const clampScore = (score) => Math.min(5, Math.max(1, Math.round(Number(score) || 1)));
