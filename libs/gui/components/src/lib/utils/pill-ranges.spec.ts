import { describe, expect, it } from 'vitest';
import { excludeRangeByKey, indexOfRangeContaining, rangeKey, sameRanges } from './pill-ranges';

const compareISO = (a: string, b: string) => a.localeCompare(b);

const ranges = [
  { start: '2026-08-01', end: '2026-08-05' },
  { start: '2026-08-10' },
  { start: '2026-08-20', end: '2026-08-22' },
];

describe('excludeRangeByKey', () => {
  it('drops the range whose pill key matches', () => {
    const next = excludeRangeByKey(ranges, rangeKey(ranges[1]));
    expect(next).toEqual([ranges[0], ranges[2]]);
  });

  it('returns a fresh copy when nothing matches (and never mutates the input)', () => {
    const next = excludeRangeByKey(ranges, 'nope');
    expect(next).toEqual(ranges);
    expect(next).not.toBe(ranges);
    expect(ranges).toHaveLength(3);
  });

  it('handles an undefined value', () => {
    expect(excludeRangeByKey(undefined, 'any')).toEqual([]);
  });
});

describe('sameRanges', () => {
  it('matches identical spans and rejects any difference', () => {
    expect(sameRanges(ranges, [...ranges])).toBe(true);
    expect(sameRanges(ranges, ranges.slice(0, 2))).toBe(false);
    expect(
      sameRanges([{ start: '2026-08-10' }], [{ start: '2026-08-10', end: '2026-08-11' }]),
    ).toBe(false);
    expect(sameRanges(undefined, [])).toBe(true);
  });
});

describe('indexOfRangeContaining', () => {
  it('finds the range whose span contains the endpoint', () => {
    expect(indexOfRangeContaining(ranges, '2026-08-03', compareISO)).toBe(0);
    expect(indexOfRangeContaining(ranges, '2026-08-21', compareISO)).toBe(2);
  });

  it('treats span bounds as inclusive', () => {
    expect(indexOfRangeContaining(ranges, '2026-08-01', compareISO)).toBe(0);
    expect(indexOfRangeContaining(ranges, '2026-08-05', compareISO)).toBe(0);
  });

  it('treats an open-ended range as its single start day', () => {
    expect(indexOfRangeContaining(ranges, '2026-08-10', compareISO)).toBe(1);
    expect(indexOfRangeContaining(ranges, '2026-08-11', compareISO)).toBe(-1);
  });

  it('returns -1 when no range contains the endpoint', () => {
    expect(indexOfRangeContaining(ranges, '2026-09-01', compareISO)).toBe(-1);
    expect(indexOfRangeContaining([], '2026-08-03', compareISO)).toBe(-1);
  });
});
