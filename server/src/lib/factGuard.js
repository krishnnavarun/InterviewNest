// Fact guard for AI-rewritten answers.
//
// The coach rewrites a candidate's answer to be stronger. It must never invent
// results, so every number in the rewrite must appear somewhere in what the
// candidate actually said (or in their resume). Unverifiable numbers are
// replaced with a [metric] placeholder the candidate can fill in themselves.

const NUMBER = /\b\d[\d,]*(?:\.\d+)?(?:\s?(?:%|ms|x|k|m|s)\b|%)?(?:\s?(?:thousand|million|billion)\b)?/gi;

const MULTIPLIERS = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, billion: 1e9 };

/** Numeric value of a token, so "20k", "20,000" and "20 thousand" all match. */
function valueOf(token) {
  const lower = token.toLowerCase();
  const base = Number.parseFloat(lower.replace(/,/g, ''));
  const unit = lower.match(/(k|m|thousand|million|billion)\b/)?.[1];
  // "m" after a number with "ms" is milliseconds, not millions.
  const multiplier = unit && !/ms\b/.test(lower) ? MULTIPLIERS[unit] : 1;
  return String(Math.round(base * multiplier * 1000) / 1000);
}

const STOPWORDS = new Set(
  ('about above after again against also because been before being between both could does doing down during each ' +
    'from further have having here into itself just like more most other ought over really same should some such ' +
    'than that their them then there these they this those through under until very were what when where which while ' +
    'will with would your yours myself ourselves make made using used help helped able well much many things thing ' +
    'specifically especially decided decision chose choose approach ensure ensured focus focused').split(' ')
);

const contentWords = (text) =>
  (String(text).toLowerCase().match(/[a-z][a-z0-9+#.-]{3,}/g) ?? [])
    .map((word) => word.replace(/[.-]+$/, ''))
    .filter((word) => !STOPWORDS.has(word));

/**
 * Split prose into sentences. Punctuation only ends a sentence when followed by
 * whitespace or the end, so "Node.js" and "e.g." inside a sentence stay intact.
 * Must match the client's splitter in TopicBreakdown.jsx.
 */
export const splitSentences = (text) => String(text).match(/(?:[^.!?]|[.!?](?=\S))+(?:[.!?]+|$)\s*/g) ?? [];

/**
 * Sentence-level provenance for an AI rewrite. A sentence is "supported" when
 * most of its content words appear in what the candidate said or in their
 * resume. Sentences that contain a [placeholder] are the candidate's to fill,
 * so they count as supported. Unsupported sentences are returned so the UI can
 * flag them instead of presenting them as the candidate's own facts.
 */
export function findUnsupportedSentences(rewrite, sourceText, minSupport = 0.6) {
  const source = new Set(contentWords(sourceText));
  const sentences = splitSentences(rewrite);
  return sentences
    .map((sentence) => sentence.trim())
    .filter((sentence) => {
      if (!sentence || /\[[^\]]+\]/.test(sentence)) return false;
      const words = contentWords(sentence);
      if (words.length < 4) return false;
      const supported = words.filter((word) => source.has(word) || source.has(word.replace(/s$/, ''))).length;
      return supported / words.length < minSupport;
    });
}

export function guardNumbers(rewrite, sourceText) {
  const sourceValues = new Set((String(sourceText).match(NUMBER) ?? []).flatMap((token) => [valueOf(token), String(Number.parseFloat(token.replace(/,/g, '')))]));
  const replaced = [];
  const text = String(rewrite).replace(NUMBER, (token) => {
    if (sourceValues.has(valueOf(token))) return token;
    replaced.push(token.trim());
    return '[metric]';
  });
  return { text, replaced };
}
