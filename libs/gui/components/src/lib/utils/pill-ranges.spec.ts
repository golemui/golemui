import { describe, expect, it } from 'vitest';
import {
  buildPillItems,
  findRangeByKey,
  formatISODateForDisplay,
  formatRangeLabel,
  rangeKey,
  removeRangeByKey,
  sortRangesByStart,
} from './pill-ranges';
import { parseISODateString } from './date';
import { compareISOTimes } from './time';

/**
 * Characterization tests for the pills accessory helpers duplicated across
 * range-calendar.ts and the three range inputs. All locale-dependent calls
 * pass an explicit localeId (machine locale is es-ES).
 */

const compareDates = (a: string, b: string) =>
  parseISODateString(a).getTime() - parseISODateString(b).getTime();

describe('rangeKey', () => {
  it('joins start and end with a dash', () => {
    expect(rangeKey({ start: '2026-01-05', end: '2026-01-10' })).toBe('2026-01-05-2026-01-10');
  });

  it('repeats the start for an open-ended range', () => {
    expect(rangeKey({ start: '2026-01-05' })).toBe('2026-01-05-2026-01-05');
  });
});

describe('sortRangesByStart', () => {
  it('sorts date ranges chronologically by start without mutating the input', () => {
    const ranges = [
      { start: '2026-03-01', end: '2026-03-05' },
      { start: '2026-01-05' },
      { start: '2026-02-10', end: '2026-02-11' },
    ];
    const sorted = sortRangesByStart(ranges, compareDates);
    expect(sorted.map((r) => r.start)).toEqual(['2026-01-05', '2026-02-10', '2026-03-01']);
    expect(ranges[0].start).toBe('2026-03-01');
    expect(sorted).not.toBe(ranges);
  });

  it('sorts time ranges via compareISOTimes', () => {
    const sorted = sortRangesByStart(
      [
        { start: '15:00:00', end: '16:00:00' },
        { start: '09:30:00', end: '10:00:00' },
      ],
      compareISOTimes,
    );
    expect(sorted.map((r) => r.start)).toEqual(['09:30:00', '15:00:00']);
  });

  it('returns [] for undefined, null or non-array values', () => {
    expect(sortRangesByStart(undefined, compareDates)).toEqual([]);
    expect(sortRangesByStart(null, compareDates)).toEqual([]);
    expect(sortRangesByStart('junk' as never, compareDates)).toEqual([]);
  });
});

describe('findRangeByKey / removeRangeByKey', () => {
  const ranges = [
    { start: '2026-01-05', end: '2026-01-10' },
    { start: '2026-02-01' },
    { start: '2026-03-01', end: '2026-03-02' },
  ];

  it('finds a range by its pill key, including open-ended ones', () => {
    expect(findRangeByKey(ranges, '2026-01-05-2026-01-10')).toBe(ranges[0]);
    expect(findRangeByKey(ranges, '2026-02-01-2026-02-01')).toBe(ranges[1]);
    expect(findRangeByKey(ranges, 'nope')).toBeUndefined();
  });

  it('removes the matching range and returns it with the remaining list', () => {
    const result = removeRangeByKey(ranges, '2026-01-05-2026-01-10');
    expect(result?.removed).toEqual({ start: '2026-01-05', end: '2026-01-10' });
    expect(result?.next).toEqual([{ start: '2026-02-01' }, { start: '2026-03-01', end: '2026-03-02' }]);
    expect(ranges).toHaveLength(3);
  });

  it('removes an open-ended range matched via the ?? null endpoint comparison', () => {
    const result = removeRangeByKey(ranges, '2026-02-01-2026-02-01');
    expect(result?.removed).toEqual({ start: '2026-02-01' });
    expect(result?.next.map((r) => r.start)).toEqual(['2026-01-05', '2026-03-01']);
  });

  it('removes every duplicate with the same endpoints (filter semantics)', () => {
    const withDupes = [
      { start: '10:00:00', end: '11:00:00' },
      { start: '10:00:00', end: '11:00:00' },
      { start: '12:00:00', end: '13:00:00' },
    ];
    const result = removeRangeByKey(withDupes, '10:00:00-11:00:00');
    expect(result?.next).toEqual([{ start: '12:00:00', end: '13:00:00' }]);
  });

  it('returns null when no range matches or the list is undefined', () => {
    expect(removeRangeByKey(ranges, 'missing-key')).toBeNull();
    expect(removeRangeByKey(undefined, '2026-01-05-2026-01-10')).toBeNull();
  });
});

describe('formatISODateForDisplay', () => {
  it('formats with numeric year and 2-digit month/day in locale order', () => {
    expect(formatISODateForDisplay('2026-01-05', 'en-US')).toBe('01/05/2026');
    expect(formatISODateForDisplay('2026-01-05', 'es-ES')).toBe('05/01/2026');
  });

  it('defaults to the en locale', () => {
    expect(formatISODateForDisplay('2026-01-05', undefined)).toBe('01/05/2026');
  });

  it('returns unparseable input as-is', () => {
    expect(formatISODateForDisplay('not-a-date', 'en-US')).toBe('not-a-date');
  });
});

describe('formatRangeLabel', () => {
  const upper = (iso: string) => iso.toUpperCase();

  it('formats both endpoints joined by " - "', () => {
    expect(formatRangeLabel({ start: 'a', end: 'b' }, upper)).toBe('A - B');
  });

  it('repeats the formatted start for an open-ended range', () => {
    expect(formatRangeLabel({ start: 'a' }, upper)).toBe('A - A');
  });
});

describe('buildPillItems', () => {
  it('builds key, label and "<removeAriaLabel> <label>" aria label per range', () => {
    const items = buildPillItems(
      [
        { start: '2026-01-05', end: '2026-01-10' },
        { start: '2026-02-01' },
      ],
      (range) => formatRangeLabel(range, (iso) => formatISODateForDisplay(iso, 'en-US')),
      'Remove date',
    );
    expect(items).toEqual([
      {
        key: '2026-01-05-2026-01-10',
        label: '01/05/2026 - 01/10/2026',
        ariaLabel: 'Remove date 01/05/2026 - 01/10/2026',
      },
      {
        key: '2026-02-01-2026-02-01',
        label: '02/01/2026 - 02/01/2026',
        ariaLabel: 'Remove date 02/01/2026 - 02/01/2026',
      },
    ]);
  });

  it('returns [] for no ranges', () => {
    expect(buildPillItems([], () => '', 'Remove')).toEqual([]);
  });
});
