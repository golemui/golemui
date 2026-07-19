import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildMonthDays,
  computeDayStatus,
  type BuildMonthDaysOptions,
  type DayStatus,
  type MonthDayBase,
} from './day-status';
import { toISODateString } from './date';

/**
 * Characterization tests: these pin the CURRENT day-grid and day-highlight
 * semantics extracted from AbstractCalendar.generateDateGrid,
 * GuiCalendar/GuiRangeCalendar.getDaysInMonth,
 * GuiRangeCalendar.checkDateStatus and GuiRangeDateTimeCalendar's override.
 * All locale-dependent calls pass an explicit localeId (machine locale is
 * es-ES); Dates are built with explicit local-time constructors.
 */

const day = (d: number, month = 0, year = 2026) => new Date(year, month, d);

const emptyStatus: DayStatus = {
  isSelected: false,
  isRangeStart: false,
  isRangeEnd: false,
  isInRange: false,
  isOneDayRange: false,
  isAnchor: false,
  isSelecting: false,
  isInvalidStart: false,
  isInvalidEnd: false,
  isInvalidInRange: false,
};

describe('computeDayStatus - empty context', () => {
  it('returns every flag false', () => {
    expect(computeDayStatus(day(5), {})).toEqual(emptyStatus);
  });
});

describe('computeDayStatus - selectedISO (gui-calendar)', () => {
  it('marks only the matching calendar day selected', () => {
    expect(computeDayStatus(day(5), { selectedISO: '2026-01-05' })).toEqual({
      ...emptyStatus,
      isSelected: true,
    });
    expect(computeDayStatus(day(6), { selectedISO: '2026-01-05' })).toEqual(emptyStatus);
  });

  it('an unparseable selectedISO selects nothing', () => {
    expect(computeDayStatus(day(5), { selectedISO: 'not-a-date' })).toEqual(emptyStatus);
  });
});

describe('computeDayStatus - committed ranges', () => {
  const range = { start: day(5), end: day(8) };

  it('flags the start day (not in-range, not one-day)', () => {
    expect(computeDayStatus(day(5), { ranges: [range] })).toEqual({
      ...emptyStatus,
      isRangeStart: true,
    });
  });

  it('flags the end day', () => {
    expect(computeDayStatus(day(8), { ranges: [range] })).toEqual({
      ...emptyStatus,
      isRangeEnd: true,
    });
  });

  it('flags strictly-between days in-range (endpoints excluded)', () => {
    expect(computeDayStatus(day(6), { ranges: [range] })).toEqual({
      ...emptyStatus,
      isInRange: true,
    });
    expect(computeDayStatus(day(4), { ranges: [range] })).toEqual(emptyStatus);
    expect(computeDayStatus(day(9), { ranges: [range] })).toEqual(emptyStatus);
  });

  it('an open-ended range (no end) is its own end: one-day range on the start day', () => {
    expect(computeDayStatus(day(5), { ranges: [{ start: day(5) }] })).toEqual({
      ...emptyStatus,
      isRangeStart: true,
      isRangeEnd: true,
      isOneDayRange: true,
    });
  });

  it('accumulates flags across multiple ranges', () => {
    const ranges = [
      { start: day(2), end: day(4) },
      { start: day(10), end: day(12) },
    ];
    expect(computeDayStatus(day(11), { ranges })).toEqual({ ...emptyStatus, isInRange: true });
    expect(computeDayStatus(day(2), { ranges })).toEqual({ ...emptyStatus, isRangeStart: true });
  });

  it("QUIRK (preserved): a later range's start clears an earlier range's end flag on a shared day", () => {
    // checkDateStatus ASSIGNS isRangeEnd = !range.end on a start-day match, so
    // the outcome on a day shared by one range's end and another's start is
    // order-dependent. Unreachable through merged values (adjacent ranges are
    // merged) but pinned because `value` is an open property.
    const endThenStart = [
      { start: day(2), end: day(5) },
      { start: day(5), end: day(9) },
    ];
    expect(computeDayStatus(day(5), { ranges: endThenStart })).toEqual({
      ...emptyStatus,
      isRangeStart: true, // end flag from the first range was overwritten
    });

    const startThenEnd = [
      { start: day(5), end: day(9) },
      { start: day(2), end: day(5) },
    ];
    expect(computeDayStatus(day(5), { ranges: startThenEnd })).toEqual({
      ...emptyStatus,
      isRangeStart: true,
      isRangeEnd: true,
      isOneDayRange: true,
    });
  });
});

describe('computeDayStatus - invalid range', () => {
  const invalidRange = { start: day(5), end: day(8) };

  it('flags the endpoint days', () => {
    expect(computeDayStatus(day(5), { invalidRange })).toEqual({
      ...emptyStatus,
      isInvalidStart: true,
    });
    expect(computeDayStatus(day(8), { invalidRange })).toEqual({
      ...emptyStatus,
      isInvalidEnd: true,
    });
  });

  it('flags strictly-between days invalid-in-range (endpoints excluded)', () => {
    expect(computeDayStatus(day(6), { invalidRange })).toEqual({
      ...emptyStatus,
      isInvalidInRange: true,
    });
    expect(computeDayStatus(day(9), { invalidRange })).toEqual(emptyStatus);
  });

  it('a single-day invalid range sets both endpoint flags (renders invalid-range-single)', () => {
    expect(computeDayStatus(day(5), { invalidRange: { start: day(5), end: day(5) } })).toEqual({
      ...emptyStatus,
      isInvalidStart: true,
      isInvalidEnd: true,
    });
  });
});

describe('computeDayStatus - selecting preview span', () => {
  const selectingSpan = { start: day(5), end: day(9) };

  it('includes both endpoints and everything between', () => {
    for (const d of [5, 6, 7, 8, 9]) {
      expect(computeDayStatus(day(d), { selectingSpan })).toEqual({
        ...emptyStatus,
        isSelecting: true,
      });
    }
  });

  it('excludes days outside the span', () => {
    expect(computeDayStatus(day(4), { selectingSpan })).toEqual(emptyStatus);
    expect(computeDayStatus(day(10), { selectingSpan })).toEqual(emptyStatus);
  });
});

describe('computeDayStatus - anchor', () => {
  it('flags only the anchor day', () => {
    expect(computeDayStatus(day(5), { anchor: day(5) })).toEqual({
      ...emptyStatus,
      isAnchor: true,
    });
    expect(computeDayStatus(day(6), { anchor: day(5) })).toEqual(emptyStatus);
    expect(computeDayStatus(day(5), { anchor: null })).toEqual(emptyStatus);
  });
});

describe('computeDayStatus - working range (range date-time calendar)', () => {
  const workingRange = { start: day(5), end: day(8) };

  it('highlights the parked working range like a committed one', () => {
    expect(computeDayStatus(day(5), { workingRange })).toEqual({
      ...emptyStatus,
      isRangeStart: true,
    });
    expect(computeDayStatus(day(8), { workingRange })).toEqual({
      ...emptyStatus,
      isRangeEnd: true,
    });
    expect(computeDayStatus(day(6), { workingRange })).toEqual({
      ...emptyStatus,
      isInRange: true,
    });
  });

  it('a single-day working range is a one-day range', () => {
    expect(computeDayStatus(day(5), { workingRange: { start: day(5), end: day(5) } })).toEqual({
      ...emptyStatus,
      isRangeStart: true,
      isRangeEnd: true,
      isOneDayRange: true,
    });
  });

  it('ORs into committed-range flags (applied after them, like the override on super)', () => {
    const ranges = [{ start: day(8), end: day(12) }];
    expect(
      computeDayStatus(day(8), { ranges, workingRange: { start: day(5), end: day(8) } }),
    ).toEqual({
      ...emptyStatus,
      isRangeStart: true, // committed range starts here
      isRangeEnd: true, // working range ends here
      isOneDayRange: true,
    });
  });
});

// --- buildMonthDays ---

interface TestDay extends MonthDayBase {
  isFocusable: boolean;
}

const passThrough = (base: MonthDayBase): TestDay => ({ ...base, isFocusable: false });

/** January 2026 baseline: no disabled days, a visible fallback ref (inert). */
const build = (overrides: Partial<BuildMonthDaysOptions<TestDay>> = {}) =>
  buildMonthDays<TestDay>({
    currentDate: day(15),
    localeId: 'en',
    isDisabled: () => false,
    toDay: passThrough,
    focusFallbackDates: [day(15)],
    ...overrides,
  });

describe('buildMonthDays - grid shape', () => {
  it('renders January 2026 (en, Sunday-first) as 35 cells from Dec 28 to Jan 31', () => {
    const days = build();

    expect(days).toHaveLength(35); // 42 minus one trimmed trailing week
    expect(toISODateString(days[0].date)).toBe('2025-12-28');
    expect(toISODateString(days[34].date)).toBe('2026-01-31');
    expect(days[0].isCurrentMonth).toBe(false);
    expect(days[3].isCurrentMonth).toBe(false); // Dec 31
    expect(days[4].isCurrentMonth).toBe(true); // Jan 1
    expect(days[4].dayLabel).toBe('1');
  });

  it('trims BOTH trailing weeks for February 2026 (en): 28 cells, all current month', () => {
    const days = build({ currentDate: day(10, 1) });

    expect(days).toHaveLength(28);
    expect(toISODateString(days[0].date)).toBe('2026-02-01');
    expect(toISODateString(days[27].date)).toBe('2026-02-28');
    expect(days.every((d) => d.isCurrentMonth)).toBe(true);
  });

  it('starts the grid on the locale first weekday (es, Monday-first)', () => {
    const days = build({ localeId: 'es' });

    expect(days).toHaveLength(35);
    expect(toISODateString(days[0].date)).toBe('2025-12-29'); // Monday
    expect(toISODateString(days[34].date)).toBe('2026-02-01');
  });

  it('falls back to Sunday-first for an unknown locale', () => {
    const days = build({ localeId: 'zz-unknown' });
    expect(toISODateString(days[0].date)).toBe('2025-12-28');
  });

  it('normalizes to day 1 before applying the offset (Jan 31 + 1 month is February, not March)', () => {
    const days = build({ currentDate: day(31), offset: 1 });

    expect(days).toHaveLength(28);
    expect(days.every((d) => !d.isCurrentMonth || d.date.getMonth() === 1)).toBe(true);
    expect(toISODateString(days[0].date)).toBe('2026-02-01');
  });

  it('applies the offset across a year boundary', () => {
    const days = build({ currentDate: day(15, 11, 2025), offset: 1 });

    // Panel month is January 2026
    expect(toISODateString(days[0].date)).toBe('2025-12-28');
    expect(days[4].isCurrentMonth).toBe(true);
    expect(days[4].date.getFullYear()).toBe(2026);
  });

  it('runs every cell through the isDisabled policy hook', () => {
    const days = build({ isDisabled: (date) => toISODateString(date) === '2026-01-05' });

    const jan5 = days.find((d) => toISODateString(d.date) === '2026-01-05');
    expect(jan5?.isDisabled).toBe(true);
    expect(days.filter((d) => d.isDisabled)).toHaveLength(1);
  });

  it('maps each cell through toDay with the shared facts', () => {
    const seen: MonthDayBase[] = [];
    build({
      toDay: (base) => {
        seen.push(base);
        return { ...base, isFocusable: false };
      },
    });

    expect(seen).toHaveLength(42); // toDay runs before trimming
    expect(seen[4].dayLabel).toBe('1');
    expect(seen[4].isCurrentMonth).toBe(true);
    expect(seen[0].isCurrentMonth).toBe(false);
  });
});

describe('buildMonthDays - isToday', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks exactly the real today cell', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 10, 30));

    const days = build();
    const todays = days.filter((d) => d.isToday);
    expect(todays).toHaveLength(1);
    expect(toISODateString(todays[0].date)).toBe('2026-01-15');
  });

  it('marks nothing when today is outside the grid', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 18));

    const days = build();
    expect(days.some((d) => d.isToday)).toBe(false);
  });
});

describe('buildMonthDays - focusable fallback', () => {
  const farAway = day(10, 5); // June 2026, never visible from a January panel

  it('marks the first enabled current-month day when nothing is focusable and no reference is visible', () => {
    const days = build({
      focusFallbackDates: [farAway],
      isDisabled: (date) => ['2026-01-01', '2026-01-02'].includes(toISODateString(date)),
    });

    const focusable = days.filter((d) => d.isFocusable);
    expect(focusable).toHaveLength(1);
    expect(toISODateString(focusable[0].date)).toBe('2026-01-03'); // skips disabled Jan 1-2
  });

  it('does nothing when a reference date is visible in the months window', () => {
    const days = build({ focusFallbackDates: [day(20)] });
    expect(days.some((d) => d.isFocusable)).toBe(false);
  });

  it('reference visibility respects numberOfMonths', () => {
    const febRef = day(10, 1);

    // One visible month: February is not visible, fallback applies
    const oneMonth = build({ focusFallbackDates: [febRef], numberOfMonths: 1 });
    expect(oneMonth.some((d) => d.isFocusable)).toBe(true);

    // Two visible months: February is visible, fallback suppressed
    const twoMonths = build({ focusFallbackDates: [febRef], numberOfMonths: 2 });
    expect(twoMonths.some((d) => d.isFocusable)).toBe(false);
  });

  it('applies only on the first panel (offset 0)', () => {
    const days = build({ offset: 1, focusFallbackDates: [farAway] });
    expect(days.some((d) => d.isFocusable)).toBe(false);
  });

  it('does nothing when toDay already produced a focusable day', () => {
    const days = build({
      focusFallbackDates: [farAway],
      toDay: (base) => ({
        ...base,
        isFocusable: toISODateString(base.date) === '2026-01-10',
      }),
    });

    const focusable = days.filter((d) => d.isFocusable);
    expect(focusable).toHaveLength(1);
    expect(toISODateString(focusable[0].date)).toBe('2026-01-10');
  });

  it('an omitted or empty reference list lets the fallback apply', () => {
    const omitted = build({ focusFallbackDates: undefined });
    expect(toISODateString(omitted.filter((d) => d.isFocusable)[0].date)).toBe('2026-01-01');

    const empty = build({ focusFallbackDates: [] });
    expect(toISODateString(empty.filter((d) => d.isFocusable)[0].date)).toBe('2026-01-01');
  });

  it('an invalid reference date never counts as visible', () => {
    const days = build({ focusFallbackDates: [new Date('not-a-date')] });
    expect(days.some((d) => d.isFocusable)).toBe(true);
  });
});
