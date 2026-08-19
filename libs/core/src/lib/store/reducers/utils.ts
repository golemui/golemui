export const hasWhen = (val: unknown): val is { when: string } => {
  return val !== undefined && typeof val === 'object' && val !== null && 'when' in val;
};

// -----------------------------------------------------------------------------
// Structural comparsion
// -----------------------------------------------------------------------------

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Compares arrays by their elements and plain objects by their properties,
 * everything else is comppared by reference using `===`.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => deepEqual(item, b[index]));
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) {
      return false;
    }
    return keys.every((key) => key in b && deepEqual(a[key], b[key]));
  }

  return false;
}
