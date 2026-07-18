import { describe, expect, it } from 'vitest';
import {
  buildTimeOptions,
  compareISOTimes,
  dateTimeBoundsError,
  dateTimeRangeOverlaps,
  formatISOTimeForLocale,
  from24Hour,
  getDateTimeFormatParts,
  getDayPeriodLabels,
  getTimeFormatParts,
  INVALID_MAX_DATE_TIME_MESSAGE,
  INVALID_MIN_DATE_TIME_MESSAGE,
  isDayFullyBlocked,
  isTimeDisabled,
  isTimeRangeDisabled,
  mergeDateTimeRanges,
  mergeTimeRanges,
  oneStepAfterISOTime,
  orderDateTimeRange,
  parseISODateTimeString,
  parseISOTimeString,
  resolveDisabledTimeRangesForDate,
  resolveDisabledTimesForDate,
  resolveHourFormat,
  to24Hour,
  toISODateTimeString,
  toISOTimeString,
} from './time';

/**
 * Characterization tests: they pin the CURRENT behavior of time.ts ahead of a
 * refactor. Machine locale is es-ES / Europe/Madrid, so every locale-dependent
 * call passes an explicit localeId and Date objects are constructed explicitly
 * (never parsed through machine-locale formatting).
 *
 * Intl output can contain U+202F / U+00A0 between time and day period; this
 * normalizes any whitespace run to a single plain space before asserting.
 */
const normalizeSpaces = (value: string) => value.replace(/\s+/g, ' ');

describe('to24Hour', () => {
  it('maps 12 AM to 0 (midnight edge)', () => {
    expect(to24Hour(12, 'am')).toBe(0);
  });

  it('maps 12 PM to 12 (noon edge)', () => {
    expect(to24Hour(12, 'pm')).toBe(12);
  });

  it('keeps AM hours 1-11 unchanged', () => {
    expect(to24Hour(1, 'am')).toBe(1);
    expect(to24Hour(11, 'am')).toBe(11);
  });

  it('shifts PM hours 1-11 by 12', () => {
    expect(to24Hour(1, 'pm')).toBe(13);
    expect(to24Hour(11, 'pm')).toBe(23);
  });
});

describe('from24Hour', () => {
  it('maps 0 to 12 AM', () => {
    expect(from24Hour(0)).toEqual({ hour12: 12, period: 'am' });
  });

  it('maps 12 to 12 PM', () => {
    expect(from24Hour(12)).toEqual({ hour12: 12, period: 'pm' });
  });

  it('maps morning and evening hours', () => {
    expect(from24Hour(1)).toEqual({ hour12: 1, period: 'am' });
    expect(from24Hour(11)).toEqual({ hour12: 11, period: 'am' });
    expect(from24Hour(13)).toEqual({ hour12: 1, period: 'pm' });
    expect(from24Hour(23)).toEqual({ hour12: 11, period: 'pm' });
  });

  it('roundtrips with to24Hour for every hour of the day', () => {
    for (let h = 0; h < 24; h++) {
      const { hour12, period } = from24Hour(h);
      expect(to24Hour(hour12, period)).toBe(h);
    }
  });
});

describe('resolveHourFormat', () => {
  it('honours an explicit override regardless of locale', () => {
    expect(resolveHourFormat('en-US', '24')).toBe('24');
    expect(resolveHourFormat('es-ES', '12')).toBe('12');
  });

  it('infers 12 for en-US', () => {
    expect(resolveHourFormat('en-US')).toBe('12');
  });

  it('infers 24 for es-ES', () => {
    expect(resolveHourFormat('es-ES')).toBe('24');
  });

  it('defaults an undefined locale to en (12-hour)', () => {
    expect(resolveHourFormat(undefined)).toBe('12');
  });
});

describe('toISOTimeString', () => {
  it('zero-pads hours, minutes and seconds', () => {
    expect(toISOTimeString(new Date(2025, 0, 15, 9, 5, 7))).toBe('09:05:07');
  });

  it('formats midnight and end of day', () => {
    expect(toISOTimeString(new Date(2025, 0, 15, 0, 0, 0))).toBe('00:00:00');
    expect(toISOTimeString(new Date(2025, 0, 15, 23, 59, 59))).toBe('23:59:59');
  });
});

describe('parseISOTimeString', () => {
  it('parses HH:mm with seconds defaulting to 0', () => {
    expect(parseISOTimeString('09:30')).toEqual({ hours: 9, minutes: 30, seconds: 0 });
  });

  it('parses HH:mm:ss', () => {
    expect(parseISOTimeString('23:59:59')).toEqual({ hours: 23, minutes: 59, seconds: 59 });
  });

  it('parses the midnight edge', () => {
    expect(parseISOTimeString('00:00')).toEqual({ hours: 0, minutes: 0, seconds: 0 });
  });

  it('rejects out-of-range and malformed values', () => {
    expect(parseISOTimeString('24:00')).toBeNull();
    expect(parseISOTimeString('09:60')).toBeNull();
    expect(parseISOTimeString('9:30')).toBeNull(); // single-digit hour not accepted
    expect(parseISOTimeString('')).toBeNull();
    expect(parseISOTimeString('2025-01-15T09:30:00')).toBeNull(); // date-times not handled here
  });

  it('roundtrips with toISOTimeString', () => {
    const parsed = parseISOTimeString('18:45:30');
    expect(parsed).not.toBeNull();
    const { hours, minutes, seconds } = parsed as NonNullable<typeof parsed>;
    expect(toISOTimeString(new Date(1970, 0, 1, hours, minutes, seconds))).toBe('18:45:30');
  });
});

describe('toISODateTimeString', () => {
  it('formats a local Date as YYYY-MM-DDTHH:mm:ss with zero padding', () => {
    expect(toISODateTimeString(new Date(2025, 0, 5, 9, 5, 7))).toBe('2025-01-05T09:05:07');
  });
});

describe('parseISODateTimeString', () => {
  it('parses a full date-time as local wall-clock time', () => {
    const d = parseISODateTimeString('2025-01-05T09:05:07');
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(5);
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(5);
    expect(d.getSeconds()).toBe(7);
  });

  it('parses HH:mm date-times with seconds defaulting to 0', () => {
    const d = parseISODateTimeString('2025-06-30T23:59');
    expect(d.getSeconds()).toBe(0);
    expect(d.getMinutes()).toBe(59);
  });

  it('parses a date-only string as LOCAL midnight (not UTC)', () => {
    const d = parseISODateTimeString('2025-01-05');
    expect(d.getDate()).toBe(5);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it('roundtrips with toISODateTimeString', () => {
    const iso = '2025-12-31T23:59:59';
    expect(toISODateTimeString(parseISODateTimeString(iso))).toBe(iso);
  });

  it('falls back to native parsing for non-matching strings', () => {
    expect(Number.isNaN(parseISODateTimeString('not-a-date').getTime())).toBe(true);
  });
});

describe('compareISOTimes', () => {
  it('treats HH:mm and HH:mm:00 as equal', () => {
    expect(compareISOTimes('09:00', '09:00:00')).toBe(0);
    expect(compareISOTimes('09:00:00', '09:00')).toBe(0);
  });

  it('orders chronologically across mixed precision', () => {
    expect(compareISOTimes('09:00', '10:00')).toBeLessThan(0);
    expect(compareISOTimes('10:00', '09:59:59')).toBeGreaterThan(0);
    expect(compareISOTimes('09:00:01', '09:00')).toBeGreaterThan(0);
  });
});

describe('oneStepAfterISOTime', () => {
  it('advances by the default 30-minute step', () => {
    expect(oneStepAfterISOTime('09:00')).toBe('09:30:00');
  });

  it('advances by an explicit step and crosses the hour', () => {
    expect(oneStepAfterISOTime('09:50', 15)).toBe('10:05:00');
  });

  it('returns undefined when the step spills past the end of day', () => {
    expect(oneStepAfterISOTime('23:30', 30)).toBeUndefined();
    expect(oneStepAfterISOTime('23:45', 15)).toBeUndefined();
  });

  it('returns the last representable slot just before the day boundary', () => {
    expect(oneStepAfterISOTime('23:40', 15)).toBe('23:55:00');
  });

  it('treats a 0 step as 30 (framework number-prop coercion guard)', () => {
    expect(oneStepAfterISOTime('09:00', 0)).toBe('09:30:00');
  });

  it('drops seconds from the anchor', () => {
    expect(oneStepAfterISOTime('09:00:59', 30)).toBe('09:30:00');
  });

  it('returns undefined for an unparseable time', () => {
    expect(oneStepAfterISOTime('nope')).toBeUndefined();
  });
});

describe('buildTimeOptions', () => {
  it('builds the default 48 half-hour slots over the whole day', () => {
    const slots = buildTimeOptions({});
    expect(slots).toHaveLength(48);
    expect(slots[0]).toEqual({ value: '00:00:00', disabled: false });
    expect(slots[47]).toEqual({ value: '23:30:00', disabled: false });
  });

  it('respects minTime/maxTime as inclusive bounds', () => {
    expect(buildTimeOptions({ minTime: '09:00', maxTime: '10:00' }).map((s) => s.value)).toEqual([
      '09:00:00',
      '09:30:00',
      '10:00:00',
    ]);
  });

  it('applies a custom minuteStep', () => {
    expect(
      buildTimeOptions({ minTime: '09:00', maxTime: '09:45', minuteStep: 15 }).map((s) => s.value),
    ).toEqual(['09:00:00', '09:15:00', '09:30:00', '09:45:00']);
  });

  it('treats minuteStep 0 as the default 30 (no infinite loop)', () => {
    expect(
      buildTimeOptions({ minTime: '09:00', maxTime: '10:00', minuteStep: 0 }).map((s) => s.value),
    ).toEqual(['09:00:00', '09:30:00', '10:00:00']);
  });

  it('excludes the anchor slot when minTime carries seconds', () => {
    expect(
      buildTimeOptions({ minTime: '09:00:30', maxTime: '10:30' }).map((s) => s.value),
    ).toEqual(['09:30:00', '10:00:00', '10:30:00']);
  });

  it('flags slots inside disabled ranges (both ends inclusive)', () => {
    const slots = buildTimeOptions({
      minTime: '09:00',
      maxTime: '11:00',
      disabledRanges: [{ start: '09:30', end: '10:30' }],
    });
    expect(slots).toEqual([
      { value: '09:00:00', disabled: false },
      { value: '09:30:00', disabled: true },
      { value: '10:00:00', disabled: true },
      { value: '10:30:00', disabled: true },
      { value: '11:00:00', disabled: false },
    ]);
  });

  it('keeps fully-disabled slots in the list (disabled, not removed)', () => {
    const slots = buildTimeOptions({
      minTime: '09:00',
      maxTime: '10:00',
      disabledRanges: [{ start: '00:00', end: '23:59:59' }],
    });
    expect(slots.map((s) => s.value)).toEqual(['09:00:00', '09:30:00', '10:00:00']);
    expect(slots.every((s) => s.disabled)).toBe(true);
  });

  it('returns an empty list when maxTime precedes minTime', () => {
    expect(buildTimeOptions({ minTime: '10:00', maxTime: '09:00' })).toEqual([]);
  });

  it('falls back to 00:00:00 when minTime is unparseable', () => {
    const slots = buildTimeOptions({ minTime: 'garbage', maxTime: '00:30' });
    expect(slots.map((s) => s.value)).toEqual(['00:00:00', '00:30:00']);
  });
});

describe('formatISOTimeForLocale', () => {
  it('formats 12-hour labels for en-US', () => {
    expect(normalizeSpaces(formatISOTimeForLocale('09:30', 'en-US', '12'))).toBe('9:30 AM');
    expect(normalizeSpaces(formatISOTimeForLocale('13:05', 'en-US', '12'))).toBe('1:05 PM');
  });

  it('formats 24-hour labels for en-US when forced to 24', () => {
    expect(formatISOTimeForLocale('13:05', 'en-US', '24')).toBe('13:05');
  });

  it('formats 24-hour labels for es-ES without a leading zero on the hour', () => {
    expect(formatISOTimeForLocale('09:30', 'es-ES', '24')).toBe('9:30');
    expect(formatISOTimeForLocale('00:30', 'es-ES', '24')).toBe('0:30');
  });

  it('returns the raw input when it cannot be parsed', () => {
    expect(formatISOTimeForLocale('nope', 'en-US', '24')).toBe('nope');
  });
});

describe('getTimeFormatParts', () => {
  it('orders en-US 12-hour parts as hour, minute, dayPeriod', () => {
    const types = getTimeFormatParts('en-US', '12')
      .filter((p) => p.type !== 'literal')
      .map((p) => p.type);
    expect(types).toEqual(['hour', 'minute', 'dayPeriod']);
  });

  it('orders es-ES 24-hour parts as hour, minute with no dayPeriod', () => {
    const types = getTimeFormatParts('es-ES', '24')
      .filter((p) => p.type !== 'literal')
      .map((p) => p.type);
    expect(types).toEqual(['hour', 'minute']);
  });

  it('uses the fixed 9:05 anchor so values are deterministic', () => {
    const parts = getTimeFormatParts('en-US', '12');
    expect(parts.find((p) => p.type === 'hour')?.value).toBe('9');
    expect(parts.find((p) => p.type === 'minute')?.value).toBe('05');
  });
});

describe('getDateTimeFormatParts', () => {
  it('orders en-US 12-hour parts month-first with a trailing dayPeriod', () => {
    const types = getDateTimeFormatParts('en-US', '12')
      .filter((p) => p.type !== 'literal')
      .map((p) => p.type);
    expect(types).toEqual(['month', 'day', 'year', 'hour', 'minute', 'dayPeriod']);
  });

  it('orders es-ES 24-hour parts day-first with no dayPeriod', () => {
    const types = getDateTimeFormatParts('es-ES', '24')
      .filter((p) => p.type !== 'literal')
      .map((p) => p.type);
    expect(types).toEqual(['day', 'month', 'year', 'hour', 'minute']);
  });
});

describe('getDayPeriodLabels', () => {
  it('returns AM/PM for en-US', () => {
    expect(getDayPeriodLabels('en-US')).toEqual({ am: 'AM', pm: 'PM' });
  });

  it('returns the localized es-ES labels', () => {
    // ICU may use U+202F between the letters ('a. m.'); compare space-normalized
    const labels = getDayPeriodLabels('es-ES');
    expect(normalizeSpaces(labels.am)).toBe('a. m.');
    expect(normalizeSpaces(labels.pm)).toBe('p. m.');
  });
});

describe('mergeTimeRanges', () => {
  it('returns an empty array for empty input', () => {
    expect(mergeTimeRanges([])).toEqual([]);
  });

  it('merges overlapping ranges and normalizes to HH:mm:ss', () => {
    expect(
      mergeTimeRanges([
        { start: '09:00', end: '10:00' },
        { start: '09:30', end: '11:00' },
      ]),
    ).toEqual([{ start: '09:00:00', end: '11:00:00' }]);
  });

  it('merges ranges that exactly touch', () => {
    expect(
      mergeTimeRanges([
        { start: '09:00', end: '10:00' },
        { start: '10:00', end: '11:00' },
      ]),
    ).toEqual([{ start: '09:00:00', end: '11:00:00' }]);
  });

  it('keeps near-adjacent ranges separate (no adjacency bump)', () => {
    expect(
      mergeTimeRanges([
        { start: '09:00', end: '09:59' },
        { start: '10:00', end: '11:00' },
      ]),
    ).toEqual([
      { start: '09:00:00', end: '09:59:00' },
      { start: '10:00:00', end: '11:00:00' },
    ]);
  });

  it('sorts unordered input by start', () => {
    expect(
      mergeTimeRanges([
        { start: '14:00', end: '15:00' },
        { start: '08:00', end: '09:00' },
      ]),
    ).toEqual([
      { start: '08:00:00', end: '09:00:00' },
      { start: '14:00:00', end: '15:00:00' },
    ]);
  });

  it('keeps the wider end when a contained range is merged', () => {
    expect(
      mergeTimeRanges([
        { start: '09:00', end: '12:00' },
        { start: '10:00', end: '11:00' },
      ]),
    ).toEqual([{ start: '09:00:00', end: '12:00:00' }]);
  });
});

describe('mergeDateTimeRanges', () => {
  it('returns an empty array for empty input', () => {
    expect(mergeDateTimeRanges([])).toEqual([]);
  });

  it('merges overlapping ranges spanning midnight into one', () => {
    expect(
      mergeDateTimeRanges([
        { start: '2025-01-01T23:00:00', end: '2025-01-02T01:00:00' },
        { start: '2025-01-02T00:30:00', end: '2025-01-02T03:00:00' },
      ]),
    ).toEqual([{ start: '2025-01-01T23:00:00', end: '2025-01-02T03:00:00' }]);
  });

  it('merges ranges that exactly touch', () => {
    expect(
      mergeDateTimeRanges([
        { start: '2025-01-01T09:00:00', end: '2025-01-01T10:00:00' },
        { start: '2025-01-01T10:00:00', end: '2025-01-01T11:00:00' },
      ]),
    ).toEqual([{ start: '2025-01-01T09:00:00', end: '2025-01-01T11:00:00' }]);
  });

  it('keeps disjoint same-day ranges separate and sorts by start', () => {
    expect(
      mergeDateTimeRanges([
        { start: '2025-01-01T14:00:00', end: '2025-01-01T15:00:00' },
        { start: '2025-01-01T09:00:00', end: '2025-01-01T10:00:00' },
      ]),
    ).toEqual([
      { start: '2025-01-01T09:00:00', end: '2025-01-01T10:00:00' },
      { start: '2025-01-01T14:00:00', end: '2025-01-01T15:00:00' },
    ]);
  });

  it('normalizes short ISO inputs to full date-time strings', () => {
    expect(mergeDateTimeRanges([{ start: '2025-01-01T09:00', end: '2025-01-01T10:00' }])).toEqual([
      { start: '2025-01-01T09:00:00', end: '2025-01-01T10:00:00' },
    ]);
  });
});

describe('orderDateTimeRange', () => {
  it('keeps an already-ordered range unchanged', () => {
    expect(orderDateTimeRange('2025-01-01T09:00:00', '2025-01-01T10:00:00')).toEqual({
      start: '2025-01-01T09:00:00',
      end: '2025-01-01T10:00:00',
    });
  });

  it('swaps a reversed range', () => {
    expect(orderDateTimeRange('2025-01-01T10:00:00', '2025-01-01T09:00:00')).toEqual({
      start: '2025-01-01T09:00:00',
      end: '2025-01-01T10:00:00',
    });
  });

  it('keeps equal instants as given', () => {
    expect(orderDateTimeRange('2025-01-01T09:00:00', '2025-01-01T09:00:00')).toEqual({
      start: '2025-01-01T09:00:00',
      end: '2025-01-01T09:00:00',
    });
  });

  it('orders across days, not just times', () => {
    expect(orderDateTimeRange('2025-01-02T01:00:00', '2025-01-01T23:00:00')).toEqual({
      start: '2025-01-01T23:00:00',
      end: '2025-01-02T01:00:00',
    });
  });
});

describe('dateTimeRangeOverlaps', () => {
  const spans = [{ start: '2025-01-01T13:00:00', end: '2025-01-01T14:00:00' }];

  it('returns false for undefined or empty spans', () => {
    const range = { start: '2025-01-01T09:00:00', end: '2025-01-01T10:00:00' };
    expect(dateTimeRangeOverlaps(range, undefined)).toBe(false);
    expect(dateTimeRangeOverlaps(range, [])).toBe(false);
  });

  it('detects a range straddling a span', () => {
    expect(
      dateTimeRangeOverlaps({ start: '2025-01-01T12:00:00', end: '2025-01-01T18:00:00' }, spans),
    ).toBe(true);
  });

  it('uses open-interval semantics: touching endpoints do not overlap', () => {
    expect(
      dateTimeRangeOverlaps({ start: '2025-01-01T14:00:00', end: '2025-01-01T15:00:00' }, spans),
    ).toBe(false);
    expect(
      dateTimeRangeOverlaps({ start: '2025-01-01T12:00:00', end: '2025-01-01T13:00:00' }, spans),
    ).toBe(false);
  });

  it('detects partial overlap on either side', () => {
    expect(
      dateTimeRangeOverlaps({ start: '2025-01-01T13:30:00', end: '2025-01-01T15:00:00' }, spans),
    ).toBe(true);
    expect(
      dateTimeRangeOverlaps({ start: '2025-01-01T12:00:00', end: '2025-01-01T13:30:00' }, spans),
    ).toBe(true);
  });

  it('a zero-length range at a span start does not overlap', () => {
    expect(
      dateTimeRangeOverlaps({ start: '2025-01-01T13:00:00', end: '2025-01-01T13:00:00' }, spans),
    ).toBe(false);
  });
});

describe('resolveDisabledTimeRangesForDate', () => {
  // 2025-01-15 is a Wednesday: getDay() === 3
  it('returns an empty list for undefined or empty entries', () => {
    expect(resolveDisabledTimeRangesForDate(undefined, '2025-01-15')).toEqual([]);
    expect(resolveDisabledTimeRangesForDate([], '2025-01-15')).toEqual([]);
  });

  it('applies unscoped entries on every date and strips scope fields', () => {
    expect(
      resolveDisabledTimeRangesForDate([{ start: '09:00', end: '10:00' }], '2025-01-15'),
    ).toEqual([{ start: '09:00', end: '10:00' }]);
  });

  it('applies date-scoped entries only on the exact date', () => {
    const entries = [{ start: '09:00', end: '10:00', date: '2025-01-15' }];
    expect(resolveDisabledTimeRangesForDate(entries, '2025-01-15')).toEqual([
      { start: '09:00', end: '10:00' },
    ]);
    expect(resolveDisabledTimeRangesForDate(entries, '2025-01-16')).toEqual([]);
  });

  it('applies weekday-scoped entries only on matching weekdays', () => {
    const entries = [{ start: '09:00', end: '10:00', weekdays: [3] }];
    expect(resolveDisabledTimeRangesForDate(entries, '2025-01-15')).toEqual([
      { start: '09:00', end: '10:00' },
    ]); // Wednesday
    expect(resolveDisabledTimeRangesForDate(entries, '2025-01-16')).toEqual([]); // Thursday
  });

  it('requires all provided scopes to match', () => {
    const entries = [{ start: '09:00', end: '10:00', date: '2025-01-15', weekdays: [0] }];
    expect(resolveDisabledTimeRangesForDate(entries, '2025-01-15')).toEqual([]);
  });
});

describe('resolveDisabledTimesForDate', () => {
  it('returns an empty list for undefined or empty spans', () => {
    expect(resolveDisabledTimesForDate(undefined, '2025-01-15')).toEqual([]);
    expect(resolveDisabledTimesForDate([], '2025-01-15')).toEqual([]);
  });

  it('clips a midnight-crossing span to each side of the boundary', () => {
    const spans = [{ start: '2025-01-01T22:00:00', end: '2025-01-02T02:00:00' }];
    expect(resolveDisabledTimesForDate(spans, '2025-01-01')).toEqual([
      { start: '22:00:00', end: '23:59:59' },
    ]);
    expect(resolveDisabledTimesForDate(spans, '2025-01-02')).toEqual([
      { start: '00:00:00', end: '02:00:00' },
    ]);
  });

  it('covers the full clock on a day fully inside a multi-day span', () => {
    const spans = [{ start: '2025-01-01T12:00:00', end: '2025-01-03T12:00:00' }];
    expect(resolveDisabledTimesForDate(spans, '2025-01-02')).toEqual([
      { start: '00:00:00', end: '23:59:59' },
    ]);
  });

  it('skips spans that do not touch the day', () => {
    const spans = [{ start: '2025-01-01T09:00:00', end: '2025-01-01T10:00:00' }];
    expect(resolveDisabledTimesForDate(spans, '2025-01-02')).toEqual([]);
  });

  it('keeps an intra-day span with its own clock times', () => {
    const spans = [{ start: '2025-01-15T09:00:00', end: '2025-01-15T10:30:00' }];
    expect(resolveDisabledTimesForDate(spans, '2025-01-15')).toEqual([
      { start: '09:00:00', end: '10:30:00' },
    ]);
  });

  it('yields a zero-length range for a span ending exactly at day start', () => {
    const spans = [{ start: '2025-01-01T22:00:00', end: '2025-01-02T00:00:00' }];
    expect(resolveDisabledTimesForDate(spans, '2025-01-02')).toEqual([
      { start: '00:00:00', end: '00:00:00' },
    ]);
  });
});

describe('isTimeDisabled', () => {
  const ranges = [{ start: '09:00', end: '10:00' }];

  it('returns false for undefined or empty ranges', () => {
    expect(isTimeDisabled('09:30', undefined)).toBe(false);
    expect(isTimeDisabled('09:30', [])).toBe(false);
  });

  it('is inclusive on both ends', () => {
    expect(isTimeDisabled('09:00', ranges)).toBe(true);
    expect(isTimeDisabled('10:00', ranges)).toBe(true);
    expect(isTimeDisabled('09:30', ranges)).toBe(true);
  });

  it('returns false just outside the range', () => {
    expect(isTimeDisabled('08:59:59', ranges)).toBe(false);
    expect(isTimeDisabled('10:00:01', ranges)).toBe(false);
  });

  it('normalizes mixed HH:mm / HH:mm:ss precision', () => {
    expect(isTimeDisabled('09:00:00', ranges)).toBe(true);
    expect(isTimeDisabled('10:00:00', [{ start: '09:00:00', end: '10:00' }])).toBe(true);
  });
});

describe('isTimeRangeDisabled', () => {
  const ranges = [{ start: '13:00', end: '14:00' }];

  it('returns false for undefined or empty ranges', () => {
    expect(isTimeRangeDisabled('09:00', '18:00', undefined)).toBe(false);
    expect(isTimeRangeDisabled('09:00', '18:00', [])).toBe(false);
  });

  it('detects a span straddling a disabled block even with free endpoints', () => {
    expect(isTimeRangeDisabled('12:00', '18:00', ranges)).toBe(true);
  });

  it('is inclusive when the selection touches a disabled endpoint', () => {
    expect(isTimeRangeDisabled('10:00', '13:00', ranges)).toBe(true);
    expect(isTimeRangeDisabled('14:00', '15:00', ranges)).toBe(true);
  });

  it('returns false for a disjoint selection', () => {
    expect(isTimeRangeDisabled('09:00', '12:59', ranges)).toBe(false);
    expect(isTimeRangeDisabled('14:01', '18:00', ranges)).toBe(false);
  });

  it('defaults a missing end to the start (instant check)', () => {
    expect(isTimeRangeDisabled('13:30', undefined, ranges)).toBe(true);
    expect(isTimeRangeDisabled('12:00', undefined, ranges)).toBe(false);
  });
});

describe('isDayFullyBlocked', () => {
  it('returns false for undefined or empty spans', () => {
    expect(isDayFullyBlocked('2025-01-15', undefined)).toBe(false);
    expect(isDayFullyBlocked('2025-01-15', [])).toBe(false);
  });

  it('returns true when a span covers exactly 00:00:00 through 23:59:59', () => {
    expect(
      isDayFullyBlocked('2025-01-15', [
        { start: '2025-01-15T00:00:00', end: '2025-01-15T23:59:59' },
      ]),
    ).toBe(true);
  });

  it('returns false when the span stops one second short of day end', () => {
    expect(
      isDayFullyBlocked('2025-01-15', [
        { start: '2025-01-15T00:00:00', end: '2025-01-15T23:59:58' },
      ]),
    ).toBe(false);
  });

  it('returns true for a multi-day span containing the day', () => {
    expect(
      isDayFullyBlocked('2025-01-15', [
        { start: '2025-01-14T12:00:00', end: '2025-01-16T12:00:00' },
      ]),
    ).toBe(true);
  });

  it('is not satisfied by multiple partial spans that only jointly cover the day', () => {
    expect(
      isDayFullyBlocked('2025-01-15', [
        { start: '2025-01-15T00:00:00', end: '2025-01-15T12:00:00' },
        { start: '2025-01-15T12:00:00', end: '2025-01-15T23:59:59' },
      ]),
    ).toBe(false);
  });
});

describe('dateTimeBoundsError', () => {
  it('returns null when inside the bounds (inclusive)', () => {
    expect(
      dateTimeBoundsError('2025-01-15T09:00:00', '2025-01-15T09:00:00', '2025-01-15T10:00:00'),
    ).toBeNull();
    expect(
      dateTimeBoundsError('2025-01-15T10:00:00', '2025-01-15T09:00:00', '2025-01-15T10:00:00'),
    ).toBeNull();
  });

  it('returns the min message when before the minimum', () => {
    expect(dateTimeBoundsError('2025-01-15T08:59:59', '2025-01-15T09:00:00', undefined)).toBe(
      INVALID_MIN_DATE_TIME_MESSAGE,
    );
  });

  it('returns the max message when after the maximum', () => {
    expect(dateTimeBoundsError('2025-01-15T10:00:01', undefined, '2025-01-15T10:00:00')).toBe(
      INVALID_MAX_DATE_TIME_MESSAGE,
    );
  });

  it('honours custom messages', () => {
    expect(
      dateTimeBoundsError('2025-01-15T08:00:00', '2025-01-15T09:00:00', undefined, {
        minDateTimeMessage: 'too early',
      }),
    ).toBe('too early');
  });

  it('returns null for an unparseable value', () => {
    expect(dateTimeBoundsError('garbage', '2025-01-15T09:00:00', undefined)).toBeNull();
  });
});
