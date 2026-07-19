import { describe, expect, it } from 'vitest';
import {
  createDateRange,
  dateBoundsError,
  getDateFormatParts,
  getDayLabel,
  getMonthName,
  getMonthYearParts,
  getOrderedWeekDays,
  getWeekdayLabels,
  isDateDisabled,
  isDateInVisibleMonths,
  isSameDay,
  isToday,
  maxValidDayInMonth,
  mergeDateRanges,
  parseISODateString,
  rangeSpansDisabledDay,
  toISODateString,
  weekDaysOrder,
} from './date';
import { DISABLED_DATE_RANGE_MESSAGE } from './messages';

/**
 * Characterization tests: these pin the CURRENT behavior of the utilities in
 * date.ts ahead of a refactor. They assert what the code does today, not what
 * an ideal implementation might do. All locale-dependent calls pass an
 * explicit localeId (machine locale is es-ES); all Date assertions are built
 * from explicit local-time constructors (machine TZ is Europe/Madrid).
 */

describe('toISODateString', () => {
  it('formats a local Date as YYYY-MM-DD with zero padding', () => {
    expect(toISODateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('uses local calendar fields, ignoring the time of day', () => {
    expect(toISODateString(new Date(2026, 11, 31, 23, 59, 59))).toBe('2026-12-31');
  });

  it('handles double-digit month and day without extra padding', () => {
    expect(toISODateString(new Date(2026, 10, 21))).toBe('2026-11-21');
  });
});

describe('parseISODateString', () => {
  it('parses a date-only ISO string to local midnight (not UTC midnight)', () => {
    const d = parseISODateString('2026-03-05');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(5);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it('roundtrips through toISODateString without shifting a day (timezone edge)', () => {
    for (const iso of ['2026-01-01', '2024-02-29', '2026-12-31', '2026-03-29']) {
      expect(toISODateString(parseISODateString(iso))).toBe(iso);
    }
  });

  it('roundtrips a local Date through toISODateString and back to the same day', () => {
    const original = new Date(2026, 6, 15);
    const roundtripped = parseISODateString(toISODateString(original));
    expect(isSameDay(original, roundtripped)).toBe(true);
  });

  it('falls back to native parsing for non date-only strings', () => {
    const d = parseISODateString('2026-03-05T10:30:00');
    // No timezone suffix: native parsing treats this as local time.
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(5);
    expect(d.getHours()).toBe(10);
    expect(d.getMinutes()).toBe(30);
  });

  it('returns an Invalid Date for unparseable input', () => {
    expect(Number.isNaN(parseISODateString('not-a-date').getTime())).toBe(true);
  });
});

describe('isDateDisabled', () => {
  it('returns false when no constraints are provided', () => {
    expect(isDateDisabled('2026-03-05')).toBe(false);
  });

  it('disables days strictly before minDate; minDate itself is allowed', () => {
    expect(isDateDisabled('2026-03-04', '2026-03-05')).toBe(true);
    expect(isDateDisabled('2026-03-05', '2026-03-05')).toBe(false);
    expect(isDateDisabled('2026-03-06', '2026-03-05')).toBe(false);
  });

  it('disables days strictly after maxDate; maxDate itself is allowed', () => {
    expect(isDateDisabled('2026-03-06', undefined, '2026-03-05')).toBe(true);
    expect(isDateDisabled('2026-03-05', undefined, '2026-03-05')).toBe(false);
    expect(isDateDisabled('2026-03-04', undefined, '2026-03-05')).toBe(false);
  });

  it('disables days inside a disabled range, inclusive of both endpoints', () => {
    const ranges = [{ start: '2026-03-10', end: '2026-03-12' }];
    expect(isDateDisabled('2026-03-09', undefined, undefined, ranges)).toBe(false);
    expect(isDateDisabled('2026-03-10', undefined, undefined, ranges)).toBe(true);
    expect(isDateDisabled('2026-03-11', undefined, undefined, ranges)).toBe(true);
    expect(isDateDisabled('2026-03-12', undefined, undefined, ranges)).toBe(true);
    expect(isDateDisabled('2026-03-13', undefined, undefined, ranges)).toBe(false);
  });

  it('treats an open-ended range (no end) as disabling only its start day', () => {
    const ranges = [{ start: '2026-03-10' }];
    expect(isDateDisabled('2026-03-10', undefined, undefined, ranges)).toBe(true);
    expect(isDateDisabled('2026-03-11', undefined, undefined, ranges)).toBe(false);
  });

  it('compares only the date portion of ISO datetime strings', () => {
    expect(isDateDisabled('2026-03-04T23:00:00', '2026-03-05T00:00:00')).toBe(true);
    expect(isDateDisabled('2026-03-05T23:59:00', '2026-03-05T00:00:00')).toBe(false);
    const ranges = [{ start: '2026-03-10T08:00:00', end: '2026-03-12T09:00:00' }];
    expect(isDateDisabled('2026-03-12T23:00:00', undefined, undefined, ranges)).toBe(true);
  });

  it('checks every entry of multiple disabled ranges', () => {
    const ranges = [
      { start: '2026-03-01', end: '2026-03-02' },
      { start: '2026-03-20', end: '2026-03-21' },
    ];
    expect(isDateDisabled('2026-03-21', undefined, undefined, ranges)).toBe(true);
    expect(isDateDisabled('2026-03-10', undefined, undefined, ranges)).toBe(false);
  });

  it('returns false for an empty disabledRanges array', () => {
    expect(isDateDisabled('2026-03-05', undefined, undefined, [])).toBe(false);
  });
});

describe('dateBoundsError', () => {
  it('returns null when the day satisfies all constraints', () => {
    expect(
      dateBoundsError('2026-03-05', '2026-03-01', '2026-03-31', [{ start: '2026-03-10' }]),
    ).toBeNull();
  });

  it('returns the default minDate message for a day before minDate', () => {
    expect(dateBoundsError('2026-02-28', '2026-03-01')).toBe(
      'Invalid date: date is before the minimum allowed date.',
    );
  });

  it('returns the default maxDate message for a day after maxDate', () => {
    expect(dateBoundsError('2026-04-01', undefined, '2026-03-31')).toBe(
      'Invalid date: date is after the maximum allowed date.',
    );
  });

  it('returns the default disabled-range message, matching the exported constant', () => {
    const result = dateBoundsError('2026-03-10', undefined, undefined, [
      { start: '2026-03-10', end: '2026-03-12' },
    ]);
    expect(result).toBe(DISABLED_DATE_RANGE_MESSAGE);
    expect(result).toBe('Invalid date: date is within a disabled range.');
  });

  it('uses custom messages when provided', () => {
    const messages = {
      minDateMessage: 'too early',
      maxDateMessage: 'too late',
      disabledDateRangeMessage: 'blocked',
    };
    expect(dateBoundsError('2026-02-01', '2026-03-01', undefined, undefined, messages)).toBe(
      'too early',
    );
    expect(dateBoundsError('2026-05-01', undefined, '2026-03-31', undefined, messages)).toBe(
      'too late',
    );
    expect(
      dateBoundsError('2026-03-10', undefined, undefined, [{ start: '2026-03-10' }], messages),
    ).toBe('blocked');
  });

  it('gives minDate precedence over a disabled range covering the same day', () => {
    expect(
      dateBoundsError('2026-02-15', '2026-03-01', undefined, [
        { start: '2026-02-01', end: '2026-02-28' },
      ]),
    ).toBe('Invalid date: date is before the minimum allowed date.');
  });

  it('gives minDate precedence over maxDate when both are violated (inverted bounds)', () => {
    expect(dateBoundsError('2026-02-15', '2026-05-01', '2026-01-01')).toBe(
      'Invalid date: date is before the minimum allowed date.',
    );
  });

  it('compares only the date portion of datetime inputs', () => {
    expect(dateBoundsError('2026-03-05T10:00:00', '2026-03-05')).toBeNull();
  });
});

describe('rangeSpansDisabledDay', () => {
  const disabled = [{ start: '2026-03-10', end: '2026-03-12' }];

  it('returns true when the span crosses a disabled range', () => {
    expect(rangeSpansDisabledDay('2026-03-08', '2026-03-15', disabled)).toBe(true);
  });

  it('returns true when only the span boundary touches a disabled day', () => {
    expect(rangeSpansDisabledDay('2026-03-12', '2026-03-15', disabled)).toBe(true);
    expect(rangeSpansDisabledDay('2026-03-05', '2026-03-10', disabled)).toBe(true);
  });

  it('returns false when the span avoids all disabled days', () => {
    expect(rangeSpansDisabledDay('2026-03-13', '2026-03-20', disabled)).toBe(false);
  });

  it('returns false when there are no constraints at all', () => {
    expect(rangeSpansDisabledDay('2026-03-01', '2026-03-31')).toBe(false);
  });

  it('detects a violation of minDate at the start of the span', () => {
    expect(rangeSpansDisabledDay('2026-03-01', '2026-03-05', undefined, '2026-03-03')).toBe(true);
    expect(rangeSpansDisabledDay('2026-03-03', '2026-03-05', undefined, '2026-03-03')).toBe(false);
  });

  it('detects a violation of maxDate at the end of the span', () => {
    expect(
      rangeSpansDisabledDay('2026-03-01', '2026-03-05', undefined, undefined, '2026-03-04'),
    ).toBe(true);
    expect(
      rangeSpansDisabledDay('2026-03-01', '2026-03-04', undefined, undefined, '2026-03-04'),
    ).toBe(false);
  });

  it('handles a single-day span', () => {
    expect(rangeSpansDisabledDay('2026-03-11', '2026-03-11', disabled)).toBe(true);
    expect(rangeSpansDisabledDay('2026-03-05', '2026-03-05', disabled)).toBe(false);
  });

  it('iterates day-by-day safely across the Europe/Madrid DST change', () => {
    // DST starts 2026-03-29 in Europe/Madrid; the calendar walk must not skip a day.
    const dstDisabled = [{ start: '2026-03-29' }];
    expect(rangeSpansDisabledDay('2026-03-28', '2026-03-30', dstDisabled)).toBe(true);
  });

  it('returns false when either bound is unparseable', () => {
    expect(rangeSpansDisabledDay('garbage', '2026-03-15', disabled)).toBe(false);
    expect(rangeSpansDisabledDay('2026-03-08', 'garbage', disabled)).toBe(false);
  });

  it('returns false when start is after end (empty span)', () => {
    expect(rangeSpansDisabledDay('2026-03-15', '2026-03-08', disabled)).toBe(false);
  });
});

describe('getDateFormatParts', () => {
  it('orders parts month/day/year for en-US with "/" literals', () => {
    expect(getDateFormatParts('en-US').map((p) => p.type)).toEqual([
      'month',
      'literal',
      'day',
      'literal',
      'year',
    ]);
    expect(
      getDateFormatParts('en-US')
        .filter((p) => p.type === 'literal')
        .map((p) => p.value),
    ).toEqual(['/', '/']);
  });

  it('orders parts day/month/year for es-ES with "/" literals', () => {
    expect(getDateFormatParts('es-ES').map((p) => p.type)).toEqual([
      'day',
      'literal',
      'month',
      'literal',
      'year',
    ]);
  });

  it('defaults to the "en" locale (month-first) when localeId is undefined', () => {
    expect(getDateFormatParts(undefined).map((p) => p.type)).toEqual([
      'month',
      'literal',
      'day',
      'literal',
      'year',
    ]);
  });
});

describe('maxValidDayInMonth', () => {
  it('returns 29 for February in a leap year', () => {
    expect(maxValidDayInMonth(2, 2024)).toBe(29);
    expect(maxValidDayInMonth(2, 2000)).toBe(29);
  });

  it('returns 28 for February in a non-leap year', () => {
    expect(maxValidDayInMonth(2, 2023)).toBe(28);
    expect(maxValidDayInMonth(2, 1900)).toBe(28);
  });

  it('allows 29 for February when the year is 0 (partial input)', () => {
    expect(maxValidDayInMonth(2, 0)).toBe(29);
  });

  it('returns 30 for April, June, September and November', () => {
    expect(maxValidDayInMonth(4, 2026)).toBe(30);
    expect(maxValidDayInMonth(6, 2026)).toBe(30);
    expect(maxValidDayInMonth(9, 2026)).toBe(30);
    expect(maxValidDayInMonth(11, 2026)).toBe(30);
  });

  it('returns 31 for the remaining months', () => {
    for (const month of [1, 3, 5, 7, 8, 10, 12]) {
      expect(maxValidDayInMonth(month, 2026)).toBe(31);
    }
  });
});

describe('isToday', () => {
  it('returns true for the current moment and a different time today', () => {
    const now = new Date();
    expect(isToday(now)).toBe(true);
    const sameDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 1);
    expect(isToday(sameDay)).toBe(true);
  });

  it('returns false for yesterday and tomorrow', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isToday(yesterday)).toBe(false);
    expect(isToday(tomorrow)).toBe(false);
  });
});

describe('isSameDay', () => {
  it('returns true for the same calendar day at different times', () => {
    expect(isSameDay(new Date(2026, 2, 5, 0, 0), new Date(2026, 2, 5, 23, 59))).toBe(true);
  });

  it('returns false when only the day differs', () => {
    expect(isSameDay(new Date(2026, 2, 5), new Date(2026, 2, 6))).toBe(false);
  });

  it('returns false for the same day number in a different month or year', () => {
    expect(isSameDay(new Date(2026, 2, 5), new Date(2026, 3, 5))).toBe(false);
    expect(isSameDay(new Date(2026, 2, 5), new Date(2025, 2, 5))).toBe(false);
  });
});

describe('getOrderedWeekDays', () => {
  it('starts from Sunday for firstDay 0', () => {
    expect(getOrderedWeekDays(0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('starts from Monday for firstDay 1', () => {
    expect(getOrderedWeekDays(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it('starts from Saturday for firstDay 6', () => {
    expect(getOrderedWeekDays(6)).toEqual([6, 0, 1, 2, 3, 4, 5]);
  });

  it('wraps firstDay 7 (CLDR Sunday) around to a Sunday start via modulo', () => {
    expect(getOrderedWeekDays(7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe('weekDaysOrder', () => {
  it('returns Sunday-first for "en" (weekInfoData firstDay 7)', () => {
    expect(weekDaysOrder('en')).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('returns Monday-first for "es" (weekInfoData firstDay 1)', () => {
    expect(weekDaysOrder('es')).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it('defaults to "en" (Sunday-first) when localeId is undefined', () => {
    expect(weekDaysOrder(undefined)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('strips the region subtag to reach the base-language entry', () => {
    // Region-tagged locales (CLDR omits default regions like "es-ES") fall back
    // to the base language: "es-ES" resolves through "es" to Monday-first, while
    // "en-US" resolves through "en" to Sunday-first.
    expect(weekDaysOrder('en-US')).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(weekDaysOrder('es-ES')).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it('defaults to a Sunday start when neither the locale nor its base is known', () => {
    expect(weekDaysOrder('xx-XX')).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe('getWeekdayLabels', () => {
  it('returns narrow labels Sunday-first for "en-US"', () => {
    expect(getWeekdayLabels('en-US')).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
  });

  it('returns narrow labels Monday-first for "es"', () => {
    expect(getWeekdayLabels('es')).toEqual(['L', 'M', 'X', 'J', 'V', 'S', 'D']);
  });

  it('returns Spanish narrow labels Monday-first for "es-ES" (base-subtag order)', () => {
    // Labels come from Intl (es-ES); the order resolves through the "es" base
    // entry, so es-ES renders Monday-first.
    expect(getWeekdayLabels('es-ES')).toEqual(['L', 'M', 'X', 'J', 'V', 'S', 'D']);
  });
});

describe('getMonthName', () => {
  it('returns the long month name for en-US', () => {
    expect(getMonthName('en-US', new Date(2026, 2, 5))).toBe('March');
  });

  it('returns the long month name for es-ES', () => {
    expect(getMonthName('es-ES', new Date(2026, 2, 5))).toBe('marzo');
  });
});

describe('isDateInVisibleMonths', () => {
  const base = new Date(2026, 2, 15); // March 2026

  it('matches a date in the base month', () => {
    expect(isDateInVisibleMonths(new Date(2026, 2, 1), base, 1)).toBe(true);
  });

  it('matches a date in a later visible panel', () => {
    expect(isDateInVisibleMonths(new Date(2026, 3, 30), base, 2)).toBe(true);
  });

  it('rejects a date in the month after the visible window', () => {
    expect(isDateInVisibleMonths(new Date(2026, 3, 1), base, 1)).toBe(false);
  });

  it('rejects a date in the month before the base month', () => {
    expect(isDateInVisibleMonths(new Date(2026, 1, 28), base, 2)).toBe(false);
  });

  it('handles the year rollover between visible panels', () => {
    const december = new Date(2025, 11, 10);
    expect(isDateInVisibleMonths(new Date(2026, 0, 5), december, 2)).toBe(true);
    expect(isDateInVisibleMonths(new Date(2026, 1, 5), december, 2)).toBe(false);
  });

  it('rejects the same month in a different year', () => {
    expect(isDateInVisibleMonths(new Date(2025, 2, 15), base, 1)).toBe(false);
  });

  it('returns false when numberOfMonths is 0', () => {
    expect(isDateInVisibleMonths(new Date(2026, 2, 15), base, 0)).toBe(false);
  });
});

describe('getMonthYearParts', () => {
  it('returns month before year for en-US, dropping literal separators', () => {
    expect(getMonthYearParts('en-US', new Date(2026, 2, 5))).toEqual([
      { type: 'month', value: 'March' },
      { type: 'year', value: '2026' },
    ]);
  });

  it('returns year before month for ja-JP (the 月 suffix is a filtered literal)', () => {
    expect(getMonthYearParts('ja-JP', new Date(2026, 2, 5))).toEqual([
      { type: 'year', value: '2026' },
      { type: 'month', value: '3' },
    ]);
  });

  it('honors the monthFormat argument', () => {
    expect(getMonthYearParts('en-US', new Date(2026, 2, 5), 'numeric')).toEqual([
      { type: 'month', value: '3' },
      { type: 'year', value: '2026' },
    ]);
    expect(getMonthYearParts('es-ES', new Date(2026, 2, 5), 'numeric')).toEqual([
      { type: 'month', value: '3' },
      { type: 'year', value: '2026' },
    ]);
  });
});

describe('getDayLabel', () => {
  it('returns the numeric day for en-US', () => {
    expect(getDayLabel('en-US', new Date(2026, 2, 5))).toBe('5');
  });

  it('uses locale-specific digits (ar-EG)', () => {
    expect(getDayLabel('ar-EG', new Date(2026, 2, 5))).toBe('٥');
  });

  it('defaults to en-US when localeId is undefined or empty', () => {
    expect(getDayLabel(undefined, new Date(2026, 2, 5))).toBe('5');
    expect(getDayLabel('', new Date(2026, 2, 5))).toBe('5');
  });
});

describe('createDateRange', () => {
  it('returns only start when both dates are the same day', () => {
    const range = createDateRange(new Date(2026, 2, 5, 9), new Date(2026, 2, 5, 18));
    expect(range).toEqual({ start: '2026-03-05' });
    expect('end' in range).toBe(false);
  });

  it('returns start and end for distinct days', () => {
    expect(createDateRange(new Date(2026, 2, 5), new Date(2026, 2, 10))).toEqual({
      start: '2026-03-05',
      end: '2026-03-10',
    });
  });

  it('does not swap an inverted pair (start after end)', () => {
    expect(createDateRange(new Date(2026, 2, 10), new Date(2026, 2, 5))).toEqual({
      start: '2026-03-10',
      end: '2026-03-05',
    });
  });
});

describe('mergeDateRanges', () => {
  it('returns an empty array for empty input', () => {
    expect(mergeDateRanges([])).toEqual([]);
  });

  it('merges overlapping ranges', () => {
    expect(
      mergeDateRanges([
        { start: '2026-03-01', end: '2026-03-10' },
        { start: '2026-03-05', end: '2026-03-15' },
      ]),
    ).toEqual([{ start: '2026-03-01', end: '2026-03-15' }]);
  });

  it('merges adjacent ranges (next starts the day after current ends)', () => {
    expect(
      mergeDateRanges([
        { start: '2026-03-01', end: '2026-03-05' },
        { start: '2026-03-06', end: '2026-03-10' },
      ]),
    ).toEqual([{ start: '2026-03-01', end: '2026-03-10' }]);
  });

  it('does not merge ranges separated by a one-day gap', () => {
    expect(
      mergeDateRanges([
        { start: '2026-03-01', end: '2026-03-05' },
        { start: '2026-03-07', end: '2026-03-10' },
      ]),
    ).toEqual([
      { start: '2026-03-01', end: '2026-03-05' },
      { start: '2026-03-07', end: '2026-03-10' },
    ]);
  });

  it('absorbs a range fully contained in another', () => {
    expect(
      mergeDateRanges([
        { start: '2026-03-01', end: '2026-03-10' },
        { start: '2026-03-03', end: '2026-03-05' },
      ]),
    ).toEqual([{ start: '2026-03-01', end: '2026-03-10' }]);
  });

  it('keeps disjoint ranges separate and sorted by start', () => {
    expect(
      mergeDateRanges([
        { start: '2026-05-01', end: '2026-05-03' },
        { start: '2026-03-01', end: '2026-03-03' },
      ]),
    ).toEqual([
      { start: '2026-03-01', end: '2026-03-03' },
      { start: '2026-05-01', end: '2026-05-03' },
    ]);
  });

  it('sorts unsorted input before merging', () => {
    expect(
      mergeDateRanges([
        { start: '2026-03-08', end: '2026-03-12' },
        { start: '2026-03-01', end: '2026-03-04' },
        { start: '2026-03-04', end: '2026-03-09' },
      ]),
    ).toEqual([{ start: '2026-03-01', end: '2026-03-12' }]);
  });

  it('merges adjacent single-day ranges (no end) into one range', () => {
    expect(mergeDateRanges([{ start: '2026-03-06' }, { start: '2026-03-05' }])).toEqual([
      { start: '2026-03-05', end: '2026-03-06' },
    ]);
  });

  it('collapses duplicate single-day ranges into a start-only range', () => {
    expect(mergeDateRanges([{ start: '2026-03-05' }, { start: '2026-03-05' }])).toEqual([
      { start: '2026-03-05' },
    ]);
  });

  it('keeps single-day ranges two days apart separate, as start-only ranges', () => {
    expect(mergeDateRanges([{ start: '2026-03-05' }, { start: '2026-03-08' }])).toEqual([
      { start: '2026-03-05' },
      { start: '2026-03-08' },
    ]);
  });

  it('merges across the Europe/Madrid DST boundary without off-by-one', () => {
    // DST starts 2026-03-29 locally; the +1 day adjacency check must still work.
    expect(
      mergeDateRanges([
        { start: '2026-03-27', end: '2026-03-28' },
        { start: '2026-03-29', end: '2026-03-30' },
      ]),
    ).toEqual([{ start: '2026-03-27', end: '2026-03-30' }]);
  });
});
