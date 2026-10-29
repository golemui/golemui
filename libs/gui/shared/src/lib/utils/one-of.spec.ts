import { describe, expect, it } from 'vitest';
import { isOption } from './one-of';

describe('isOption', () => {
  it('accepts an object with a label and a value', () => {
    expect(isOption({ label: 'A', value: 'a' })).toBe(true);
  });

  it('rejects null, a string and an array', () => {
    expect(isOption(null)).toBe(false);
    expect(isOption('a')).toBe(false);
    expect(isOption([])).toBe(false);
  });

  it('rejects an object without a value', () => {
    expect(isOption({ label: 'A' })).toBe(false);
  });

  it('rejects an object that only inherits label and value', () => {
    expect(isOption(Object.create({ label: 1, value: 2 }))).toBe(false);
  });
});
