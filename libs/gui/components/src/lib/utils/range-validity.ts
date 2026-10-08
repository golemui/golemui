import type { GuiValidity } from '../gui-form-control';
import type { DateRange, DateTimeRange, TimeRange } from '../types';
import { rangeSpansDisabledDay } from './date';
import { message } from './messages';
import {
  compareISOTimes,
  dateTimeRangeOverlaps,
  isTimeRangeDisabled,
  parseISODateTimeString,
} from './time';

/** One bound pair a range's endpoints must stay within, with the message for each side. */
interface EndpointBounds {
  /** Negative when `a` is earlier than `b`. NaN (an unparsable value) never fails a bound. */
  compare: (a: string, b: string) => number;
  min: string | undefined;
  max: string | undefined;
  minMessage: () => string;
  maxMessage: () => string;
}

/** The checks a list of ranges must pass: endpoint bounds, then disabled ranges. */
interface RangesCheck<R extends { start: string; end?: string }> {
  bounds: EndpointBounds[];
  disabled: { test: (range: R) => boolean; message: () => string };
}

/**
 * The validity of the first range that breaks a check, or null when every range passes. An
 * endpoint before a minimum underflows, one after a maximum overflows, and a range over a disabled
 * one is a custom error.
 */
function rangesValidity<R extends { start: string; end?: string }>(
  ranges: R[] | undefined,
  check: RangesCheck<R>,
): GuiValidity | null {
  for (const range of ranges ?? []) {
    for (const endpoint of [range.start, range.end]) {
      if (!endpoint) continue;
      for (const { compare, min, max, minMessage, maxMessage } of check.bounds) {
        if (min && compare(endpoint, min) < 0) {
          return { flags: { rangeUnderflow: true }, message: minMessage() };
        }
        if (max && compare(endpoint, max) > 0) {
          return { flags: { rangeOverflow: true }, message: maxMessage() };
        }
      }
    }
    if (check.disabled.test(range)) {
      return { flags: { customError: true }, message: check.disabled.message() };
    }
  }
  return null;
}

/** Compares the day portion of two ISO strings, as `dateBoundsError` does. */
const compareDays = (a: string, b: string): number => {
  const left = a.split('T')[0];
  const right = b.split('T')[0];
  return left < right ? -1 : left > right ? 1 : 0;
};

const compareDateTimes = (a: string, b: string): number =>
  parseISODateTimeString(a).getTime() - parseISODateTimeString(b).getTime();

/** The bounds of a date range element, named like its properties. */
export interface DateRangeBounds {
  minDate?: string;
  maxDate?: string;
  disabledRanges?: DateRange[];
  minDateMessage?: string;
  maxDateMessage?: string;
  disabledDateRangeMessage?: string;
}

/**
 * Why a list of date ranges is invalid: an endpoint outside `minDate`/`maxDate`, or a span that
 * steps over a day of `disabledRanges`. Null when every range is allowed.
 *
 * @param {DateRange[] | undefined} ranges - The value to check.
 * @param {DateRangeBounds} bounds - The element's bounds and messages (pass the element itself).
 * @return {GuiValidity | null} The first violation, or null.
 */
export function dateRangesValidity(
  ranges: DateRange[] | undefined,
  bounds: DateRangeBounds,
): GuiValidity | null {
  return rangesValidity(ranges, {
    bounds: [
      {
        compare: compareDays,
        min: bounds.minDate,
        max: bounds.maxDate,
        minMessage: () => message('minDate', bounds.minDateMessage),
        maxMessage: () => message('maxDate', bounds.maxDateMessage),
      },
    ],
    disabled: {
      test: (range) =>
        rangeSpansDisabledDay(range.start, range.end ?? range.start, bounds.disabledRanges),
      message: () => message('disabledDateRange', bounds.disabledDateRangeMessage),
    },
  });
}

/** The bounds of a time range element, named like its properties. */
export interface TimeRangeBounds {
  minTime?: string;
  maxTime?: string;
  disabledRanges?: TimeRange[];
  minTimeMessage?: string;
  maxTimeMessage?: string;
  disabledRangeMessage?: string;
}

/**
 * Why a list of time ranges is invalid: an endpoint outside `minTime`/`maxTime`, or a range that
 * overlaps one of `disabledRanges`. Null when every range is allowed.
 *
 * @param {TimeRange[] | undefined} ranges - The value to check.
 * @param {TimeRangeBounds} bounds - The element's bounds and messages (pass the element itself).
 * @return {GuiValidity | null} The first violation, or null.
 */
export function timeRangesValidity(
  ranges: TimeRange[] | undefined,
  bounds: TimeRangeBounds,
): GuiValidity | null {
  return rangesValidity(ranges, {
    bounds: [
      {
        compare: compareISOTimes,
        min: bounds.minTime,
        max: bounds.maxTime,
        minMessage: () => message('minTime', bounds.minTimeMessage),
        maxMessage: () => message('maxTime', bounds.maxTimeMessage),
      },
    ],
    disabled: {
      test: (range) => isTimeRangeDisabled(range.start, range.end, bounds.disabledRanges),
      message: () => message('disabledTimeRange', bounds.disabledRangeMessage),
    },
  });
}

/** The bounds of a date-time range element, named like its properties. */
export interface DateTimeRangeBounds {
  minDateTime?: string;
  maxDateTime?: string;
  /** Day bounds, on the elements that have them besides the instant ones. */
  minDate?: string;
  maxDate?: string;
  disabledRanges?: DateTimeRange[];
  minDateTimeMessage?: string;
  maxDateTimeMessage?: string;
  disabledRangeMessage?: string;
}

/**
 * Why a list of date-time ranges is invalid: an endpoint outside `minDateTime`/`maxDateTime` (or
 * outside the `minDate`/`maxDate` days), or a range that overlaps one of `disabledRanges`. Null
 * when every range is allowed.
 *
 * @param {DateTimeRange[] | undefined} ranges - The value to check.
 * @param {DateTimeRangeBounds} bounds - The element's bounds and messages (pass the element itself).
 * @return {GuiValidity | null} The first violation, or null.
 */
export function dateTimeRangesValidity(
  ranges: DateTimeRange[] | undefined,
  bounds: DateTimeRangeBounds,
): GuiValidity | null {
  return rangesValidity(ranges, {
    bounds: [
      {
        compare: compareDateTimes,
        min: bounds.minDateTime,
        max: bounds.maxDateTime,
        minMessage: () => message('minDateTime', bounds.minDateTimeMessage),
        maxMessage: () => message('maxDateTime', bounds.maxDateTimeMessage),
      },
      {
        compare: compareDays,
        min: bounds.minDate,
        max: bounds.maxDate,
        minMessage: () => message('minDate'),
        maxMessage: () => message('maxDate'),
      },
    ],
    disabled: {
      test: (range) => dateTimeRangeOverlaps(range, bounds.disabledRanges),
      message: () => message('disabledDateRange', bounds.disabledRangeMessage),
    },
  });
}
