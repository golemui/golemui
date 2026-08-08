/**
 * Pure day-grid construction and per-day highlight computation for the
 * calendar components.
 */
import {
  getDayLabel,
  isDateInVisibleMonths,
  isSameDay,
  isToday,
  parseISODateString,
  weekDaysOrder,
} from './date';

/** An ordered, inclusive pair of calendar-day Dates. */
export interface DaySpan {
  start: Date;
  end: Date;
}

/**
 * Orders two days into a span. Every highlight test here walks start → end, so
 * an unordered pair — a range whose end was entered before its start — would
 * light up nothing at all.
 *
 * @param {Date} a - One endpoint.
 * @param {Date} b - The other endpoint.
 * @return {DaySpan} The pair, earliest first.
 */
export function orderedDaySpan(a: Date, b: Date): DaySpan {
  return a.getTime() <= b.getTime() ? { start: a, end: b } : { start: b, end: a };
}

/**
 * A committed range normalized to calendar-day Dates — the caller applies its
 * `endpointDay` policy first (plain parse for the range calendar, date-part
 * parse for the date-time flavor), so this module never sees ISO endpoint
 * strings. A missing `end` is an open-ended (single-day) range.
 */
export interface NormalizedDayRange {
  start: Date;
  end?: Date;
}

/** The optional inputs a component provides for its day highlights. */
export interface DayStatusContext {
  /** ISO day of the single selected value. */
  selectedISO?: string;
  /** Committed ranges, endpoints normalized to day Dates. */
  ranges?: NormalizedDayRange[];
  /** Anchor day of an in-progress two-click selection. */
  anchor?: Date | null;
  /**
   * The ordered in-progress span: the hover preview, or a picker's parked
   * working range. Only `ranges` renders the solid committed look, so a span
   * that is not a pill yet always reads as in progress.
   */
  selectingSpan?: DaySpan | null;
  /** The rejected range currently highlighted in red. */
  invalidRange?: DaySpan | null;
}

/** Every highlight flag any of the three calendars' `renderDay` bindings consume. */
export interface DayStatus {
  /** gui-calendar `selected` (single-value calendars). */
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  /** Both endpoints on this day — renders `selected` instead of start/end caps. */
  isOneDayRange: boolean;
  isAnchor: boolean;
  /** Inside the in-progress span (endpoints inclusive). */
  isSelecting: boolean;
  isInvalidStart: boolean;
  isInvalidEnd: boolean;
  /** Strictly between the invalid endpoints (exclusive). */
  isInvalidInRange: boolean;
}

/**
 * Computes the highlight flags of one grid day. Semantics ported exactly:
 *
 * @param {Date} date - The grid day (local midnight).
 * @param {DayStatusContext} ctx - The component's highlight inputs.
 * @return {DayStatus} All highlight flags for the day.
 */
export function computeDayStatus(date: Date, ctx: DayStatusContext): DayStatus {
  const dateTime = date.getTime();

  let isSelected = false;
  let isRangeStart = false;
  let isRangeEnd = false;
  let isInRange = false;
  let isSelecting = false;
  let isInvalidStart = false;
  let isInvalidEnd = false;
  let isInvalidInRange = false;

  if (ctx.selectedISO) {
    isSelected = isSameDay(date, parseISODateString(ctx.selectedISO));
  }

  if (ctx.invalidRange) {
    const invalidStart = ctx.invalidRange.start;
    const invalidEnd = ctx.invalidRange.end;
    isInvalidStart = isSameDay(date, invalidStart);
    isInvalidEnd = isSameDay(date, invalidEnd);
    if (dateTime > invalidStart.getTime() && dateTime < invalidEnd.getTime()) {
      isInvalidInRange = true;
    }
  }

  if (ctx.selectingSpan) {
    isSelecting =
      dateTime >= ctx.selectingSpan.start.getTime() && dateTime <= ctx.selectingSpan.end.getTime();
  }

  if (ctx.ranges) {
    for (const range of ctx.ranges) {
      if (isSameDay(date, range.start)) {
        isRangeStart = true;
        isRangeEnd = !range.end;
      }

      if (range.end) {
        if (isSameDay(date, range.end)) {
          isRangeEnd = true;
        }

        if (dateTime > range.start.getTime() && dateTime < range.end.getTime()) {
          isInRange = true;
        }
      }
    }
  }

  return {
    isSelected,
    isRangeStart,
    isRangeEnd,
    isInRange,
    isOneDayRange: isRangeStart && isRangeEnd,
    isAnchor: ctx.anchor ? isSameDay(date, ctx.anchor) : false,
    isSelecting,
    isInvalidStart,
    isInvalidEnd,
    isInvalidInRange,
  };
}

/** The shared per-cell facts handed to the `toDay` mapping. */
export interface MonthDayBase {
  date: Date;
  dayLabel: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isDisabled: boolean;
}

/** What the grid machinery needs back from a mapped day. */
export interface MonthDayFlags {
  isCurrentMonth: boolean;
  isDisabled: boolean;
  isFocusable: boolean;
}

export interface BuildMonthDaysOptions<D extends MonthDayFlags> {
  /** The calendar's `_currentDate` (first visible month, any day-of-month). */
  currentDate: Date;
  /** Panel offset in months from `currentDate`. Default 0. */
  offset?: number;
  /** Locale for the grid's first weekday and the day labels. */
  localeId?: string;
  /** Visible months window for the focus-fallback visibility check. Default 1. */
  numberOfMonths?: number;
  /** The component's day-disabling policy. */
  isDisabled: (date: Date) => boolean;
  /**
   * Maps one cell to the component's day object — per-day status flags and
   * the component's own `isFocusable` policy live here.
   */
  toDay: (base: MonthDayBase) => D;
  /**
   * The reference days whose visibility suppresses the focusable fallback
   * (see {@link buildMonthDays}). GuiCalendar passes `[selected ?? today]`;
   * GuiRangeCalendar passes `[today, ...range starts]`. When none is visible
   * in the months window (or the list is empty/omitted), the fallback applies.
   */
  focusFallbackDates?: Date[];
}

/**
 * Builds one month panel's day list — `generateDateGrid` plus the shared
 * `getDaysInMonth` skeleton:
 *
 * 1. Normalizes to day 1 before applying the month offset (a `currentDate` on
 *    the 31st never skips a short month), and derives the panel's target
 *    month.
 * 2. Generates the 42-cell grid starting on the locale's first weekday of the
 *    week containing day 1, mapping each cell through `isDisabled` and
 *    `toDay` with the shared facts (date, locale day label, current-month
 *    membership, today).
 * 3. Trims the trailing week up to TWICE when it contains only next-month days.
 * 4. Focusable fallback, in the first panel when no mapped day is focusable AND
 *    no `focusFallbackDates` entry falls inside the visible months window, the
 *    first current-month non-disabled day is focused.
 *
 * @param {BuildMonthDaysOptions<D>} options - Grid inputs and the component hooks.
 * @return {D[]} The mapped days, trimmed, in grid order.
 */
export function buildMonthDays<D extends MonthDayFlags>(options: BuildMonthDaysOptions<D>): D[] {
  const { currentDate, offset = 0, localeId, numberOfMonths = 1 } = options;

  // generateDateGrid: 42 cells from the locale-aligned start of the week
  // containing day 1 of the panel month.
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
  const targetMonth = firstDayOfMonth.getMonth();
  const dayOfWeek = firstDayOfMonth.getDay();
  const gridStartDay = weekDaysOrder(localeId)[0];
  const offsetDay = (dayOfWeek - gridStartDay + 7) % 7;
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(firstDayOfMonth.getDate() - offsetDay);

  let days: D[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    days.push(
      options.toDay({
        date,
        dayLabel: getDayLabel(localeId, date),
        isCurrentMonth: date.getMonth() === targetMonth,
        isToday: isToday(date),
        isDisabled: options.isDisabled(date),
      }),
    );
  }

  // We remove the 6th and 5th week if it only contains days of the next month
  for (let i = 0; i < 2; i++) {
    const lastWeek = days.slice(-7);
    if (lastWeek.every((day) => !day.isCurrentMonth)) {
      days = days.slice(0, -7);
    }
  }

  if (offset === 0 && !days.some((d) => d.isFocusable)) {
    const anyReferenceVisible = (options.focusFallbackDates ?? []).some((ref) =>
      isDateInVisibleMonths(ref, currentDate, numberOfMonths),
    );
    if (!anyReferenceVisible) {
      const firstDay = days.find((d) => d.isCurrentMonth && !d.isDisabled);
      if (firstDay) firstDay.isFocusable = true;
    }
  }

  return days;
}
