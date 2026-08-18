import { describe, expect, it } from 'vitest';
import { deepEqual } from './utils';

describe('deepEqual', () => {
  it('compares arrays by their elements, at any depth', () => {
    expect(deepEqual([1, { a: [2] }], [1, { a: [2] }])).toBe(true);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
    expect(deepEqual([1], [1, 2])).toBe(false);
  });

  it('compares plain objects by their properties, and counts the keys', () => {
    expect(deepEqual({ a: 1, b: { c: 'x' } }, { b: { c: 'x' }, a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('compares everything else by reference', () => {
    const fn = () => undefined;
    expect(deepEqual(fn, fn)).toBe(true);
    expect(deepEqual(fn, () => undefined)).toBe(false);
    expect(deepEqual(new Date(0), new Date(0))).toBe(false);
  });

  it('does not treat an array and an object with the same entries as equal', () => {
    expect(deepEqual([1], { 0: 1 })).toBe(false);
  });
});
