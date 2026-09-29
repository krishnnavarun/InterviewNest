import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { generationConfigFor, modelChain, parseModelJson, toGeminiSchemas, truncateToSchema } from '../src/ai/gemini.js';
import { env } from '../src/config/env.js';

const Schema = z.object({
  score: z.number().int().min(1).max(5),
  tags: z.array(z.object({ name: z.string() })).min(1).max(2).describe('Tags'),
});

test('wire schema moves array bounds into the description', () => {
  const { full, wire } = toGeminiSchemas(Schema);
  assert.equal(full.$schema, undefined);
  assert.equal(full.properties.tags.maxItems, 2);
  assert.equal(wire.properties.tags.maxItems, undefined);
  assert.equal(wire.properties.tags.minItems, undefined);
  assert.equal(wire.properties.tags.description, 'Tags (at least 1, at most 2 items)');
  assert.equal(wire.properties.score.maximum, 5); // numeric bounds are kept
});

test('drops the safe-integer bounds Zod adds to .int()', () => {
  const { full } = toGeminiSchemas(z.object({ n: z.number().int() }));
  assert.equal(full.properties.n.minimum, undefined);
  assert.equal(full.properties.n.maximum, undefined);
});

test('truncates over-long arrays so validation can pass', () => {
  const { full } = toGeminiSchemas(Schema);
  const data = truncateToSchema({ score: 3, tags: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] }, full);
  assert.equal(data.tags.length, 2);
  assert.equal(Schema.safeParse(data).success, true);
});

test('parses JSON wrapped in markdown fences', () => {
  assert.deepEqual(parseModelJson('```json\n{"a":1}\n```'), { a: 1 });
});

test('model chain starts with the primary model and has no duplicates', () => {
  const chain = modelChain();
  assert.equal(chain[0], env.GEMINI_MODEL);
  assert.equal(new Set(chain).size, chain.length);
});

test('uses thinking levels for Gemini 3 and budgets for Gemini 2.5', () => {
  assert.deepEqual(generationConfigFor('gemini-3.8-flash', { thinking: 'off', temperature: 0.4 }), { thinkingConfig: { thinkingLevel: 'LOW' } });
  assert.deepEqual(generationConfigFor('gemini-3.8-flash', { thinking: 'auto', temperature: 0.4 }), {});
  assert.deepEqual(generationConfigFor('gemini-2.5-flash', { thinking: 'off', temperature: 0.4 }), {
    temperature: 0.4,
    thinkingConfig: { thinkingBudget: 0 },
  });
  assert.equal(generationConfigFor('gemini-2.5-pro', { thinking: 'off' }).thinkingConfig.thinkingBudget, 128);
});
