export function fail(msg) {
  throw new Error(msg);
}

export function assert(condition, msg = 'assertion failed') {
  if (!condition)
    fail(msg);
}

export function assertTruthy(value, msg = 'expected truthy') {
  if (!value)
    fail(msg);
}

export function assertEquals(actual, expected, msg = 'expected equality') {
  if (actual !== expected)
    fail(`${msg}\n  expected: ${expected}\n  actual:   ${actual}`);
}

export function assertThrows(fn, msg = 'expected function to throw') {
  let threw = false;
  try {
    fn();
  } catch (e) {
    threw = true;
  }
  if (!threw)
    fail(msg);
}


