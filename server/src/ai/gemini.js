// Gemini wrapper used by every AI feature.
//
// Guarantees for callers:
//   1. Structured output: the model is constrained with a JSON Schema generated
//      from a Zod schema, and the response is validated again with Zod.
//   2. Self-repair: if validation fails, the model is re-prompted once with the
//      exact validation errors.
//   3. Resilience: a transient error (429/5xx/timeout) is retried once, then the
//      request fails over to the next model in the chain. A model that keeps
//      failing is skipped for a while (circuit breaker) so users don't pay its
//      timeout on every call.
//   4. Observability: every call reports feature, model, latency and token usage
//      to a listener (persisted per user/interview by the usage service).
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../lib/AppError.js';

const ATTEMPTS_PER_MODEL = 2;
const BREAKER_COOLDOWN_MS = 3 * 60 * 1000;
const TRANSIENT_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const TRANSIENT_MESSAGE =
  /UNAVAILABLE|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED|high demand|overloaded|timed? ?out|aborted|fetch failed|ECONNRESET|socket hang up/i;

let client = null;
let usageListener = null;
const breakerOpenUntil = new Map(); // model -> timestamp

function getClient() {
  if (!env.GEMINI_API_KEY) {
    throw new AppError(503, 'The AI service is not configured (GEMINI_API_KEY missing).');
  }
  client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return client;
}

/** Register a callback that receives metadata for every model call. */
export function setUsageListener(listener) {
  usageListener = listener;
}

/** Primary model first, then fallbacks; models with an open breaker go last. */
export function modelChain(now = Date.now()) {
  const chain = [...new Set([env.GEMINI_MODEL, ...env.GEMINI_FALLBACK_MODELS.split(',')].map((m) => m.trim()).filter(Boolean))];
  const healthy = chain.filter((model) => (breakerOpenUntil.get(model) ?? 0) <= now);
  const tripped = chain.filter((model) => !healthy.includes(model));
  return [...healthy, ...tripped];
}

/**
 * Convert a Zod schema into JSON Schema for Gemini.
 *  - `full`: the complete schema (used locally to truncate over-long arrays).
 *  - `wire`: what we send to the model. Array length bounds are moved into the
 *    description because large `maxItems` on arrays of objects make some models
 *    reject the request ("invalid argument"); Zod still enforces the limits.
 */
export function toGeminiSchemas(zodSchema) {
  const clean = (node) => {
    if (Array.isArray(node)) return node.map(clean);
    if (!node || typeof node !== 'object') return node;
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      if (key === '$schema') continue;
      // Zod adds +/- MAX_SAFE_INTEGER bounds to every .int(); they are noise for the model.
      if ((key === 'minimum' || key === 'maximum') && Math.abs(value) >= Number.MAX_SAFE_INTEGER) continue;
      out[key] = clean(value);
    }
    return out;
  };
  const toWire = (node) => {
    if (Array.isArray(node)) return node.map(toWire);
    if (!node || typeof node !== 'object') return node;
    const { minItems, maxItems, ...rest } = node;
    const out = Object.fromEntries(Object.entries(rest).map(([key, value]) => [key, toWire(value)]));
    if (minItems !== undefined || maxItems !== undefined) {
      const limits = [minItems !== undefined && `at least ${minItems}`, maxItems !== undefined && `at most ${maxItems}`].filter(Boolean).join(', ');
      out.description = [out.description, `(${limits} items)`].filter(Boolean).join(' ');
    }
    return out;
  };
  const full = clean(z.toJSONSchema(zodSchema));
  return { full, wire: toWire(full) };
}

/** Trim arrays that exceed `maxItems` so a slightly long answer is not rejected. */
export function truncateToSchema(data, schema) {
  if (!schema || data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    const items = schema.maxItems !== undefined ? data.slice(0, schema.maxItems) : data;
    return items.map((item) => truncateToSchema(item, schema.items));
  }
  if (!schema.properties) return data;
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, truncateToSchema(value, schema.properties[key])]));
}

/** Parse model text as JSON, tolerating accidental markdown fences. */
export function parseModelJson(text) {
  const cleaned = String(text)
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

/**
 * Model-specific generation settings.
 * `thinking`: 'off' = fastest supported, 'low' = some reasoning, 'auto' = model default.
 */
export function generationConfigFor(model, { thinking, temperature }) {
  if (model.startsWith('gemini-2.5')) {
    const minimum = model.includes('pro') ? 128 : 0; // Flash can disable thinking; Pro needs >= 128
    return {
      temperature,
      ...(thinking === 'auto' ? {} : { thinkingConfig: { thinkingBudget: thinking === 'off' ? minimum : Math.max(minimum, 1024) } }),
    };
  }
  // Gemini 3.x: reasoning is set with thinkingLevel, and Google recommends the
  // default temperature, so we do not override it.
  if (thinking === 'auto') return {};
  return { thinkingConfig: { thinkingLevel: thinking === 'off' ? 'LOW' : 'MEDIUM' } };
}

function isTransient(error) {
  const status = Number(error?.status ?? error?.code);
  return TRANSIENT_STATUS.has(status) || TRANSIENT_MESSAGE.test(String(error?.message));
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function report(meta) {
  if (!usageListener) return;
  Promise.resolve()
    .then(() => usageListener(meta))
    .catch((error) => console.error('[ai] usage listener failed:', error.message));
}

class SchemaError extends Error {}

async function callModel(model, { feature, system, prompt, schema, jsonSchema, thinking, temperature, timeoutMs, context }) {
  let contents = prompt;
  let lastError = null;

  for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
    const startedAt = Date.now();
    const base = { feature, model, attempt, fallback: model !== env.GEMINI_MODEL, ...context };
    try {
      const response = await getClient().models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: system,
          responseMimeType: 'application/json',
          responseJsonSchema: jsonSchema.wire,
          ...generationConfigFor(model, { thinking, temperature }),
          httpOptions: { timeout: timeoutMs },
        },
      });
      const usage = response.usageMetadata ?? {};
      const meta = {
        ...base,
        latencyMs: Date.now() - startedAt,
        promptTokens: usage.promptTokenCount ?? 0,
        outputTokens: usage.candidatesTokenCount ?? 0,
        thoughtsTokens: usage.thoughtsTokenCount ?? 0,
      };

      const text = response.text;
      let parsed;
      try {
        if (!text) throw new Error(`empty response (finishReason: ${response.candidates?.[0]?.finishReason ?? 'unknown'})`);
        parsed = schema.safeParse(truncateToSchema(parseModelJson(text), jsonSchema.full));
      } catch (error) {
        parsed = { success: false, error };
      }
      report({ ...meta, ok: parsed.success });
      if (parsed.success) return { data: parsed.data, meta };

      // Self-repair: show the model exactly what was wrong with its output.
      const problem = parsed.error instanceof z.ZodError ? z.prettifyError(parsed.error) : String(parsed.error?.message);
      lastError = new SchemaError(`Response did not match the schema: ${problem}`);
      contents = `${prompt}\n\nYour previous response was invalid:\n${problem}\nReturn a corrected JSON object only.`;
    } catch (error) {
      report({ ...base, latencyMs: Date.now() - startedAt, ok: false, error: String(error.message).slice(0, 200) });
      lastError = error;
      if (!isTransient(error)) throw error;
      if (attempt < ATTEMPTS_PER_MODEL) await sleep(500 + Math.random() * 400);
    }
  }
  throw lastError;
}

/**
 * Generate a JSON object that is guaranteed to satisfy `schema`.
 *
 * @param {object} options
 * @param {string} options.feature   short name used for logging/usage (e.g. 'interview_turn')
 * @param {string} options.system    system instruction
 * @param {string} options.prompt    user prompt
 * @param {z.ZodType} options.schema Zod schema for the response
 * @param {number} [options.temperature] used only by models that support overriding it
 * @param {'off'|'low'|'auto'} [options.thinking] reasoning effort; 'off' is fastest
 * @param {number} [options.timeoutMs] per-request timeout before retry/failover
 * @param {{userId?: string, interviewId?: string}} [options.context]
 * @returns {Promise<{data: any, meta: object}>}
 */
export async function generateJSON({
  feature,
  system,
  prompt,
  schema,
  temperature = 0.4,
  thinking = 'low',
  timeoutMs = 30000,
  deadlineMs = timeoutMs * 2.5,
  context = {},
}) {
  const request = { feature, system, prompt, schema, jsonSchema: toGeminiSchemas(schema), thinking, temperature, timeoutMs, context };
  const startedAt = Date.now();
  let lastError = null;

  for (const model of modelChain()) {
    // Overall time budget: a user waiting on a live turn should get a clear
    // "try again" rather than minutes of silent failover.
    if (lastError && Date.now() - startedAt > deadlineMs) break;
    try {
      const result = await callModel(model, request);
      breakerOpenUntil.delete(model);
      if (model !== env.GEMINI_MODEL) console.warn(`[ai] ${feature} served by fallback model ${model}`);
      return result;
    } catch (error) {
      lastError = error;
      if (isTransient(error)) breakerOpenUntil.set(model, Date.now() + BREAKER_COOLDOWN_MS);
      console.warn(`[ai] ${feature} failed on ${model}: ${String(error.message).slice(0, 160)}`);
      // Try the next model for overload, timeouts, unsupported settings or bad output.
    }
  }

  console.error(`[ai] ${feature} failed after ${Date.now() - startedAt}ms`);
  if (Number(lastError?.status) === 429) {
    throw new AppError(429, 'The AI service is rate-limited right now. Please wait a minute and try again.', { cause: lastError });
  }
  if (lastError instanceof AppError) throw lastError;
  if (isTransient(lastError)) {
    throw new AppError(503, 'The AI is under heavy load right now. Please try again in a moment.', { cause: lastError });
  }
  throw new AppError(502, 'The AI service could not complete this request. Please try again.', { cause: lastError });
}
