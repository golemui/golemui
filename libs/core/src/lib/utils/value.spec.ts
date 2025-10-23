import { describe, expect, it } from 'vitest';
import { isLiteral } from './value';

describe('value.isLiteral', () => {
  it('returns true for string, number, boolean, bigint', () => {
    expect(isLiteral('hello')).toBe(true);
    expect(isLiteral(42)).toBe(true);
    expect(isLiteral(false)).toBe(true);
    expect(isLiteral(123n)).toBe(true);
  });

  it('returns false for Symbol', () => {
    expect(isLiteral(Symbol('x'))).toBe(false);
  });

  it('returns false for null and undefined', () => {
    expect(isLiteral(null)).toBe(false);
    expect(isLiteral(undefined)).toBe(false);
  });

  it('returns false for objects, arrays, and functions', () => {
    expect(isLiteral({})).toBe(false);
    expect(isLiteral([])).toBe(false);
    expect(isLiteral(() => ({}))).toBe(false);
  });
});
