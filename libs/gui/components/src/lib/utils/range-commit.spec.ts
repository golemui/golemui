import { describe, expect, it } from 'vitest';
import {
  commitRange,
  orderEndpoints,
  type CommitRangeOptions,
  type RangeEndpoint,
} from './range-commit';
import { mergeDateRanges } from './date';
import {
  compareISOTimes,
  dateTimeRangeOverlaps,
  mergeDateTimeRanges,
  mergeTimeRanges,
  orderDateTimeRange,
} from './time';
import type { DateTimeRange } from '@golemui/gui-shared/internals';

/**
 * Characterization tests for the shared tryCreatePill skeleton extracted from
 * range-date-input.ts, range-time-input.ts and range-date-time-input.ts.
 */

const valid = <V>(value: V): RangeEndpoint<V> => ({ kind: 'valid', value });
const invalid = (message: string): RangeEndpoint<never> => ({ kind: 'invalid', message });
const incomplete: RangeEndpoint<never> = { kind: 'incomplete' };

interface StringRange {
  start: string;
  end?: string;
}

/** range-date-input flavor: swap by date, collapse same-day, mergeDateRanges. */
const dateOptions: CommitRangeOptions<string, StringRange> = {
  order: (start, end) => orderEndpoints(start, end, (a, b) => (a < b ? -1 : a > b ? 1 : 0)),
  toRange: ({ start, end }) => (start === end ? { start } : { start, end }),
  merge: mergeDateRanges,
};

describe('orderEndpoints', () => {
  it('keeps an already-ordered pair', () => {
    expect(orderEndpoints(1, 2, (a, b) => a - b)).toEqual({ start: 1, end: 2 });
  });

  it('swaps a reversed pair', () => {
    expect(orderEndpoints(5, 3, (a, b) => a - b)).toEqual({ start: 3, end: 5 });
  });

  it('keeps an equal pair as-is', () => {
    expect(orderEndpoints('2026-01-05', '2026-01-05', compareISOTimes)).toEqual({
      start: '2026-01-05',
      end: '2026-01-05',
    });
  });
});

describe('commitRange - completeness and invalid precedence', () => {
  it('is incomplete while either endpoint is incomplete', () => {
    expect(commitRange(incomplete, incomplete, [], dateOptions)).toEqual({ kind: 'incomplete' });
    expect(commitRange(valid('2026-01-05'), incomplete, [], dateOptions)).toEqual({
      kind: 'incomplete',
    });
    expect(commitRange(incomplete, valid('2026-01-05'), [], dateOptions)).toEqual({
      kind: 'incomplete',
    });
  });

  it('an invalid endpoint wins over completeness (checked first)', () => {
    expect(commitRange(invalid('bad start'), incomplete, [], dateOptions)).toEqual({
      kind: 'invalid',
      message: 'bad start',
    });
    expect(commitRange(incomplete, invalid('bad end'), [], dateOptions)).toEqual({
      kind: 'invalid',
      message: 'bad end',
    });
  });

  it("start's error message takes precedence over end's", () => {
    expect(commitRange(invalid('bad start'), invalid('bad end'), [], dateOptions)).toEqual({
      kind: 'invalid',
      message: 'bad start',
    });
  });
});

describe('commitRange - date flavor (swap + collapse + merge)', () => {
  it('commits an ordered pair as a start/end range merged into the existing pills', () => {
    const result = commitRange(valid('2026-01-05'), valid('2026-01-10'), [], dateOptions);
    expect(result).toEqual({ kind: 'commit', value: [{ start: '2026-01-05', end: '2026-01-10' }] });
  });

  it('swaps a reversed pair instead of rejecting it', () => {
    const result = commitRange(valid('2026-01-10'), valid('2026-01-05'), [], dateOptions);
    expect(result).toEqual({ kind: 'commit', value: [{ start: '2026-01-05', end: '2026-01-10' }] });
  });

  it('collapses a same-day pair to an open-ended range', () => {
    const result = commitRange(valid('2026-01-05'), valid('2026-01-05'), [], dateOptions);
    expect(result).toEqual({ kind: 'commit', value: [{ start: '2026-01-05' }] });
  });

  it('merges with existing ranges via the supplied merge fn (undefined existing = [])', () => {
    const existing = [{ start: '2026-01-08', end: '2026-01-12' }];
    const result = commitRange(valid('2026-01-05'), valid('2026-01-09'), existing, dateOptions);
    expect(result).toEqual({ kind: 'commit', value: [{ start: '2026-01-05', end: '2026-01-12' }] });
    expect(existing).toEqual([{ start: '2026-01-08', end: '2026-01-12' }]);

    expect(commitRange(valid('2026-01-05'), valid('2026-01-06'), undefined, dateOptions)).toEqual({
      kind: 'commit',
      value: [{ start: '2026-01-05', end: '2026-01-06' }],
    });
  });
});

describe('commitRange - time flavor (identity order + validate rejection)', () => {
  const timeOptions: CommitRangeOptions<string, { start: string; end: string }> = {
    // No order fn: range-time-input rejects reversed ranges instead of swapping.
    validate: ({ start, end }) =>
      compareISOTimes(end, start) <= 0 ? 'Invalid range: end time must be after start time.' : null,
    toRange: ({ start, end }) => ({ start, end }),
    merge: mergeTimeRanges,
  };

  it('commits a forward range', () => {
    const result = commitRange(valid('09:00:00'), valid('10:30:00'), [], timeOptions);
    expect(result).toEqual({ kind: 'commit', value: [{ start: '09:00:00', end: '10:30:00' }] });
  });

  it('keeps the entered order and lets validate reject a reversed range', () => {
    expect(commitRange(valid('10:30:00'), valid('09:00:00'), [], timeOptions)).toEqual({
      kind: 'invalid',
      message: 'Invalid range: end time must be after start time.',
    });
  });

  it('rejects a zero-length range (end <= start, matching the original)', () => {
    expect(commitRange(valid('09:00:00'), valid('09:00:00'), [], timeOptions)).toEqual({
      kind: 'invalid',
      message: 'Invalid range: end time must be after start time.',
    });
  });
});

describe('commitRange - date-time flavor (swap + overlap validate)', () => {
  const disabled: DateTimeRange[] = [
    { start: '2026-01-05T13:00:00', end: '2026-01-05T14:00:00' },
  ];
  const dateTimeOptions: CommitRangeOptions<string, DateTimeRange> = {
    order: (start, end) => orderDateTimeRange(start, end),
    validate: (ordered) =>
      dateTimeRangeOverlaps(ordered, disabled)
        ? 'Invalid date: date is within a disabled range.'
        : null,
    toRange: ({ start, end }) => ({ start, end }),
    merge: mergeDateTimeRanges,
  };

  it('swaps a reversed pair, then commits', () => {
    const result = commitRange(
      valid('2026-01-06T10:00:00'),
      valid('2026-01-06T08:00:00'),
      [],
      dateTimeOptions,
    );
    expect(result).toEqual({
      kind: 'commit',
      value: [{ start: '2026-01-06T08:00:00', end: '2026-01-06T10:00:00' }],
    });
  });

  it('rejects a range straddling a disabled span (validated AFTER the swap)', () => {
    const result = commitRange(
      valid('2026-01-05T15:00:00'),
      valid('2026-01-05T12:00:00'),
      [],
      dateTimeOptions,
    );
    expect(result).toEqual({
      kind: 'invalid',
      message: 'Invalid date: date is within a disabled range.',
    });
  });

  it('merges overlapping commits into one pill', () => {
    const existing: DateTimeRange[] = [
      { start: '2026-01-06T09:00:00', end: '2026-01-06T11:00:00' },
    ];
    const result = commitRange(
      valid('2026-01-06T10:00:00'),
      valid('2026-01-06T12:00:00'),
      existing,
      dateTimeOptions,
    );
    expect(result).toEqual({
      kind: 'commit',
      value: [{ start: '2026-01-06T09:00:00', end: '2026-01-06T12:00:00' }],
    });
  });
});
