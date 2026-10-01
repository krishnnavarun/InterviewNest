import { test } from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler, isDbUnreachable } from '../src/middleware/error.js';

const named = (name, cause) => Object.assign(new Error(name), { name, cause });

test('recognises database outages anywhere in the cause chain', () => {
  assert.equal(isDbUnreachable(named('MongooseServerSelectionError')), true);
  assert.equal(isDbUnreachable(named('MongoServerSelectionError')), true);
  assert.equal(isDbUnreachable(named('MongoPoolClearedError', named('MongoNetworkError'))), true);
  assert.equal(isDbUnreachable(named('Error', named('MongoNetworkTimeoutError'))), true);
  assert.equal(isDbUnreachable(named('MongoServerError')), false);
  assert.equal(isDbUnreachable(new TypeError('x')), false);
});

test('a database outage becomes a friendly 503', () => {
  let sent;
  const res = { headersSent: false, status(code) { sent = { code }; return this; }, json(body) { sent.body = body; } };
  const original = console.error;
  console.error = () => {};
  try {
    errorHandler(named('MongoPoolClearedError', named('MongoNetworkError')), { method: 'POST', originalUrl: '/x' }, res, () => {});
  } finally {
    console.error = original;
  }
  assert.equal(sent.code, 503);
  assert.match(sent.body.message, /database is temporarily unreachable/);
});
