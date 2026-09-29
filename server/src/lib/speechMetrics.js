// Speech analytics computed from word-level timestamps returned by the
// speech-to-text service (AssemblyAI returns { text, start, end } in ms).

const FILLER_WORDS = new Set(['um', 'umm', 'uh', 'uhh', 'uhm', 'er', 'erm', 'ah', 'hmm', 'mm']);
const FILLER_PHRASES = ['you know', 'i mean', 'kind of', 'sort of'];
const LONG_PAUSE_MS = 2000;

const normalizeWord = (word) => String(word).toLowerCase().replace(/[^a-z']/g, '');

/**
 * @param {{text: string, start: number, end: number}[]} words
 * @returns {null | {
 *   durationSec: number, wordCount: number, wpm: number,
 *   fillerCount: number, fillersPerMin: number, fillerBreakdown: Record<string, number>,
 *   longPauseCount: number, longestPauseSec: number
 * }}
 */
export function computeSpeechMetrics(words, { longPauseMs = LONG_PAUSE_MS } = {}) {
  if (!Array.isArray(words) || words.length === 0) return null;

  const durationMs = Math.max(0, words[words.length - 1].end - words[0].start);
  const minutes = durationMs / 60000;
  const tokens = words.map((word) => normalizeWord(word.text));

  const fillerBreakdown = {};
  for (const token of tokens) {
    if (FILLER_WORDS.has(token)) fillerBreakdown[token] = (fillerBreakdown[token] ?? 0) + 1;
  }
  const joined = ` ${tokens.join(' ')} `;
  for (const phrase of FILLER_PHRASES) {
    const count = joined.split(` ${phrase} `).length - 1;
    if (count > 0) fillerBreakdown[phrase] = count;
  }
  const fillerCount = Object.values(fillerBreakdown).reduce((sum, count) => sum + count, 0);

  let longPauseCount = 0;
  let longestPauseMs = 0;
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end;
    if (gap >= longPauseMs) longPauseCount += 1;
    longestPauseMs = Math.max(longestPauseMs, gap);
  }

  return {
    durationSec: round(durationMs / 1000, 1),
    wordCount: words.length,
    wpm: minutes > 0 ? Math.round(words.length / minutes) : 0,
    fillerCount,
    fillersPerMin: minutes > 0 ? round(fillerCount / minutes, 1) : 0,
    fillerBreakdown,
    longPauseCount,
    longestPauseSec: round(longestPauseMs / 1000, 1),
  };
}

/** Combine per-answer metrics into interview-level metrics (duration weighted). */
export function aggregateSpeechMetrics(metricsList) {
  const list = metricsList.filter(Boolean);
  if (list.length === 0) return null;

  const totalWords = list.reduce((sum, metrics) => sum + metrics.wordCount, 0);
  const totalSec = list.reduce((sum, metrics) => sum + metrics.durationSec, 0);
  const totalFillers = list.reduce((sum, metrics) => sum + metrics.fillerCount, 0);
  const minutes = totalSec / 60;

  const fillerBreakdown = {};
  for (const metrics of list) {
    for (const [word, count] of Object.entries(metrics.fillerBreakdown ?? {})) {
      fillerBreakdown[word] = (fillerBreakdown[word] ?? 0) + count;
    }
  }
  const topFillers = Object.entries(fillerBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word, count]) => ({ word, count }));

  const wpm = minutes > 0 ? Math.round(totalWords / minutes) : 0;
  return {
    answers: list.length,
    totalSpeakingSec: Math.round(totalSec),
    wpm,
    pace: paceLabel(wpm),
    fillerCount: totalFillers,
    fillersPerMin: minutes > 0 ? round(totalFillers / minutes, 1) : 0,
    topFillers,
    longPauseCount: list.reduce((sum, metrics) => sum + metrics.longPauseCount, 0),
    longestPauseSec: Math.max(...list.map((metrics) => metrics.longestPauseSec)),
  };
}

export function paceLabel(wpm) {
  if (!wpm) return 'unknown';
  if (wpm < 110) return 'slow';
  if (wpm > 170) return 'fast';
  return 'comfortable';
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
