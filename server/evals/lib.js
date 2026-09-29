// Small helpers shared by the eval scripts.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const EVALS_DIR = dirname(fileURLToPath(import.meta.url));

export function parseArgs(defaults) {
  const args = { ...defaults };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    args[key] = typeof defaults[key] === 'number' ? Number(value) : value;
  }
  return args;
}

/** Runs async tasks one after another, starting at most `rpm` per minute. */
export async function throttled(items, rpm, task, onProgress) {
  const gapMs = Math.ceil(60000 / rpm);
  const results = [];
  let lastStart = 0;
  for (const [index, item] of items.entries()) {
    const wait = lastStart + gapMs - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastStart = Date.now();
    try {
      results.push(await task(item, index));
    } catch (error) {
      results.push({ error: error.cause?.message ?? error.message, item });
    }
    onProgress?.(index + 1, items.length);
  }
  return results;
}

export const mean = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : NaN);

export function percentile(values, p) {
  if (!values.length) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

export function pearson(xs, ys) {
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : NaN;
}

const ranks = (values) => {
  const order = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const result = new Array(values.length);
  for (let i = 0; i < order.length; ) {
    let j = i;
    while (j + 1 < order.length && order[j + 1].value === order[i].value) j++;
    for (let k = i; k <= j; k++) result[order[k].index] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return result;
};

export const spearman = (xs, ys) => pearson(ranks(xs), ranks(ys));

export const fmt = (value, digits = 2) => (Number.isFinite(value) ? value.toFixed(digits) : 'n/a');

export function saveResults(name, markdown, json) {
  const dir = join(EVALS_DIR, 'results');
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  writeFileSync(join(dir, `${name}-${stamp}.md`), markdown);
  writeFileSync(join(dir, `${name}-${stamp}.json`), JSON.stringify(json, null, 2));
  writeFileSync(join(dir, `${name}-latest.md`), markdown);
  return join(dir, `${name}-${stamp}.md`);
}
