// Structural equality for JSON values used to check test-case outputs.
// Numbers are compared with a small tolerance (Python may return 2.0 for 2).
export function jsonEqual(actual, expected, tolerance = 1e-6) {
  if (typeof actual === 'number' && typeof expected === 'number') {
    return Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected));
  }
  if (actual === null || expected === null || typeof actual !== 'object' || typeof expected !== 'object') {
    return actual === expected;
  }
  if (Array.isArray(actual) !== Array.isArray(expected)) return false;
  if (Array.isArray(actual)) {
    return actual.length === expected.length && actual.every((item, index) => jsonEqual(item, expected[index], tolerance));
  }
  const actualKeys = Object.keys(actual);
  const expectedKeys = Object.keys(expected);
  if (actualKeys.length !== expectedKeys.length) return false;
  return expectedKeys.every((key) => Object.hasOwn(actual, key) && jsonEqual(actual[key], expected[key], tolerance));
}

/** Parse a JSON string, returning `fallback` instead of throwing. */
export function safeJsonParse(text, fallback = undefined) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}
