import type { DateRange, DisabledTimeRange } from '../types';
import { dateBoundsError, toISODateString } from './date';
import { message } from './messages';
import { timeBoundsError } from './parts';
import {
  isTimeDisabled,
  parseISODateTimeString,
  resolveDisabledTimeRangesForDate,
  toISOTimeString,
} from './time';

/** The bounds of a date and time value, with optional message overrides. */
export interface DateTimeValueBounds {
  minDate?: string;
  maxDate?: string;
  disabledRanges?: DateRange[];
  minTime?: string;
  maxTime?: string;
  disabledTimeRanges?: DisabledTimeRange[];
  minDateMessage?: string;
  maxDateMessage?: string;
  disabledDateRangeMessage?: string;
  minTimeMessage?: string;
  maxTimeMessage?: string;
  disabledTimeRangeMessage?: string;
}

/**
 * Checks an ISO date and time against its day's bounds, then against its time's: `minDate`,
 * `maxDate` and `disabledRanges`, then `minTime`, `maxTime` and the disabled time ranges of that
 * day.
 *
 * @param {string | undefined} value - The ISO date and time, such as `2026-03-15T10:30:00`.
 * @param {DateTimeValueBounds} bounds - The bounds plus optional message overrides.
 * @return {string | null} The message for the first violated bound, or null.
 */
export function dateTimeValueBoundsError(
  value: string | undefined,
  bounds: DateTimeValueBounds,
): string | null {
  if (!value) return null;
  const date = parseISODateTimeString(value);
  if (isNaN(date.getTime())) return null;

  const isoDate = toISODateString(date);
  const dateError = dateBoundsError(
    isoDate,
    bounds.minDate,
    bounds.maxDate,
    bounds.disabledRanges,
    {
      minDateMessage: bounds.minDateMessage,
      maxDateMessage: bounds.maxDateMessage,
      disabledDateRangeMessage: bounds.disabledDateRangeMessage,
    },
  );
  if (dateError) return dateError;

  const isoTime = toISOTimeString(date);
  const timeError = timeBoundsError(isoTime, {
    minTime: bounds.minTime,
    maxTime: bounds.maxTime,
    minTimeMessage: bounds.minTimeMessage,
    maxTimeMessage: bounds.maxTimeMessage,
  });
  if (timeError) return timeError;

  // Disabled time ranges are date-scoped, so resolve them for the value's day.
  const ranges = resolveDisabledTimeRangesForDate(bounds.disabledTimeRanges, isoDate);
  if (isTimeDisabled(isoTime, ranges)) {
    return message('disabledTimeRange', bounds.disabledTimeRangeMessage);
  }
  return null;
}
