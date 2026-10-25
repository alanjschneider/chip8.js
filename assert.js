class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssertionError';
  }
}

export function assert(condition, message = 'Assertion failed') {
  if (!condition) throw new AssertionError(message);
}

export function assertEqual(actual, expected, message) {
  if (actual != expected) {
    throw new AssertionError(message || `Expected ${actual} === ${expected}`);
  }
}

export function assertStrictEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new AssertionError(message || `Expected ${actual} === ${expected}`);
  }
}

export function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new AssertionError(message || `Expected ${a} === ${b}`);
  }
}
