import type { DateRange } from '@golemui/gui-shared/internals';
import { weekInfoData } from './week-info';
import {
  DISABLED_DATE_RANGE_MESSAGE,
  INVALID_MAX_DATE_MESSAGE,
  INVALID_MIN_DATE_MESSAGE,
} from './messages';

/**
 * Converts a Date object to a string formatted as an ISO 8601 date (YYYY-MM-DD).
 *
 * @param {Date} date - The Date object to convert to an ISO date string.
 * @return {string} The formatted ISO date string.
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Parses an ISO 8601 date string (YYYY-MM-DD) into a Date at local midnight.
 *
 * `new Date('YYYY-MM-DD')` interprets date-only strings as UTC midnight, so in
 * timezones behind UTC the resulting Date falls on the previous local day.
 * Calendar values are timezone-less calendar days, so they must be parsed in
 * local time. Strings that are not date-only fall back to native parsing.
 *
 * @param {string} value - The ISO date string to parse.
 * @return {Date} The parsed Date anchored to the local timezone.
 */
export function parseISODateString(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(value);
}

/**
 * Determines whether an ISO calendar day (YYYY-MM-DD) falls outside the allowed
 * bounds — before `minDate`, after `maxDate`, or inside any `disabledRanges`
 * entry (inclusive; an open-ended range with no `end` disables its `start` day
 * only). All comparisons are lexical on the date-only portion, which is safe for
 * zero-padded ISO dates. Shared by the calendars (rendering disabled days) and
 * the pickers (validating a selected value).
 *
 * @param {string} isoDate - The ISO date to test (YYYY-MM-DD, or a longer ISO
 *   string whose date portion is used).
 * @param {string} [minDate] - Earliest allowed ISO date, inclusive.
 * @param {string} [maxDate] - Latest allowed ISO date, inclusive.
 * @param {DateRange[]} [disabledRanges] - Ranges of disabled days.
 * @return {boolean} True when the day is disabled.
 */
export function isDateDisabled(
  isoDate: string,
  minDate?: string,
  maxDate?: string,
  disabledRanges?: DateRange[],
): boolean {
  const day = isoDate.split('T')[0];

  if (minDate && day < minDate.split('T')[0]) return true;
  if (maxDate && day > maxDate.split('T')[0]) return true;

  if (disabledRanges && disabledRanges.length > 0) {
    for (const range of disabledRanges) {
      const start = range.start.split('T')[0];
      const end = range.end ? range.end.split('T')[0] : start;
      if (day >= start && day <= end) {
        return true;
      }
    }
  }

  return false;
}

export interface DateBoundsMessages {
  minDateMessage?: string;
  maxDateMessage?: string;
  disabledDateRangeMessage?: string;
}

/**
 * Validates an ISO day against `minDate`/`maxDate`/`disabledRanges` and returns
 * the message for the first violated constraint (falling back to an English
 * default), or null when the day is allowed. This is the picker-side companion
 * to {@link isDateDisabled}: the calendars render disabled days from the boolean
 * predicate, while the pickers surface a specific error for a selected value.
 *
 * @param {string} isoDate - The ISO date to test (its date portion is used).
 * @param {string} [minDate] - Earliest allowed ISO date, inclusive.
 * @param {string} [maxDate] - Latest allowed ISO date, inclusive.
 * @param {DateRange[]} [disabledRanges] - Ranges of disabled days.
 * @param {DateBoundsMessages} [messages] - Overrides for each constraint message.
 * @return {string | null} The violated-constraint message, or null.
 */
export function dateBoundsError(
  isoDate: string,
  minDate?: string,
  maxDate?: string,
  disabledRanges?: DateRange[],
  messages?: DateBoundsMessages,
): string | null {
  const day = isoDate.split('T')[0];
  if (minDate && day < minDate.split('T')[0]) {
    return messages?.minDateMessage ?? INVALID_MIN_DATE_MESSAGE;
  }
  if (maxDate && day > maxDate.split('T')[0]) {
    return messages?.maxDateMessage ?? INVALID_MAX_DATE_MESSAGE;
  }
  if (isDateDisabled(day, undefined, undefined, disabledRanges)) {
    return messages?.disabledDateRangeMessage ?? DISABLED_DATE_RANGE_MESSAGE;
  }
  return null;
}

/**
 * Whether any day in the inclusive `[startISO, endISO]` span is disabled. A
 * single disabled day inside the span makes the whole range invalid — used to
 * reject a range that steps over a disabled day, both from the calendar (day
 * clicks) and from typed entry in the picker.
 *
 * @param {string} startISO - The range start (its date portion is used).
 * @param {string} endISO - The range end (its date portion is used).
 * @param {DateRange[]} [disabledRanges] - Ranges of disabled days.
 * @param {string} [minDate] - Earliest allowed ISO date, inclusive.
 * @param {string} [maxDate] - Latest allowed ISO date, inclusive.
 * @return {boolean} True when at least one day in the span is disabled.
 */
export function rangeSpansDisabledDay(
  startISO: string,
  endISO: string,
  disabledRanges?: DateRange[],
  minDate?: string,
  maxDate?: string,
): boolean {
  const start = parseISODateString(startISO);
  const end = parseISODateString(endISO);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

  const iterator = new Date(start);
  iterator.setHours(0, 0, 0, 0);
  const limit = new Date(end);
  limit.setHours(0, 0, 0, 0);

  while (iterator <= limit) {
    if (isDateDisabled(toISODateString(iterator), minDate, maxDate, disabledRanges)) {
      return true;
    }
    iterator.setDate(iterator.getDate() + 1);
  }
  return false;
}

/**
 * Returns the locale-ordered numeric date parts (day, month, year and literal
 * separators) used to lay out segmented date inputs.
 *
 * @param {string | undefined} localeId - The locale identifier. Defaults to 'en'.
 * @return {Intl.DateTimeFormatPart[]} The ordered parts, including literals.
 */
export function getDateFormatParts(localeId: string | undefined): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat(localeId ?? 'en', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date());
}

/**
 * Returns the maximum valid day for the given month and year, accounting for
 * leap years. When the year is 0 or missing, February allows 29 so partial
 * input is not rejected prematurely.
 *
 * @param {number} month - The 1-based month.
 * @param {number} year - The full year.
 * @return {number} The maximum valid day of that month.
 */
export function maxValidDayInMonth(month: number, year: number): number {
  if (month === 2) {
    const isLeapYear = new Date(year, 1, 29).getDate() === 29;
    return isLeapYear || !year ? 29 : 28;
  } else if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30;
  }
  return 31;
}

/**
 * Determines whether the given date is today's date.
 *
 * @param {Date} date - The date to be checked.
 * @return {boolean} True if the given date is today, otherwise false.
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return isSameDay(date, today);
}

/**
 * Determines if two Date objects represent the same calendar day.
 *
 * @param {Date} d1 - The first date to compare.
 * @param {Date} d2 - The second date to compare.
 * @return {boolean} Returns true if both dates are on the same day, otherwise false.
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

/**
 * Returns an array of numbers representing the days of the week, ordered starting from the specified first day.
 *
 * @param {number} firstDay - The index of the first day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday).
 * @return {number[]} An array of numbers representing the reordered days of the week starting from the specified first day.
 */
export function getOrderedWeekDays(firstDay: number): number[] {
  const base = [0, 1, 2, 3, 4, 5, 6];
  const start = firstDay % 7;
  return [...base.slice(start), ...base.slice(0, start)];
}

/**
 * Returns an array of weekday numbers ordered starting with the first day of the week for the given locale.
 * The `localeId` determines the starting day of the week based on locale-specific conventions.
 *
 * @param {string | undefined} localeId - The identifier for the locale. If undefined or unsupported, defaults to 'en'.
 * @return {number[]} An array of numbers representing the days of the week, reordered to start with the locale's first day.
 */
export function weekDaysOrder(localeId: string | undefined): number[] {
  const id = localeId ?? 'en';
  // Try the exact locale, then fall back to its base language subtag before the
  // Sunday-start default.
  const localeData = weekInfoData[id] || weekInfoData[id.split('-')[0]] || { firstDay: 0 };
  return getOrderedWeekDays(localeData.firstDay);
}

/**
 * Returns an array of weekday labels based on the specified locale.
 *
 * @param {string | undefined} localeId - The locale identifier used to format weekday labels. If undefined, the default locale is used.
 * @return {string[]} An array of localized weekday labels in "narrow" format, starting from the locale's defined first day of the week.
 */
export function getWeekdayLabels(localeId: string | undefined): string[] {
  const formatter = new Intl.DateTimeFormat(localeId, { weekday: 'narrow' });
  // Anchor Sunday date
  const sundayRef = new Date(2025, 10, 30);
  return weekDaysOrder(localeId).map((dayCode) => {
    const d = new Date(sundayRef);
    d.setDate(sundayRef.getDate() + dayCode);
    return formatter.format(d);
  });
}

/**
 * Returns the full name of the month for the given date, formatted according to the specified locale.
 *
 * @param {string} localeId - The locale identifier used to format the month name, e.g., 'en-US' or 'fr-FR'.
 * @param {Date} currentDate - The date object from which the month name will be extracted.
 * @return {string} The full month name formatted in the specified locale.
 */
export function getMonthName(localeId: string | undefined, currentDate: Date): string {
  return new Intl.DateTimeFormat(localeId, { month: 'long' }).format(currentDate);
}

/**
 * Returns the month and year of the given date as a single localized string,
 * e.g. 'March 2026' in 'en-US' or '2026年3月' in 'ja-JP'. Used for the days
 * grid accessible name and the visible-months live announcement.
 *
 * @param {string | undefined} localeId - The locale identifier used to format the label.
 * @param {Date} date - The date whose month and year are formatted.
 * @return {string} The localized month/year label.
 */
export function getMonthYearLabel(localeId: string | undefined, date: Date): string {
  return new Intl.DateTimeFormat(localeId, { month: 'long', year: 'numeric' }).format(date);
}

/**
 * Returns the full localized date, e.g. 'Friday, February 13, 2026' in
 * 'en-US'. Used as the accessible name of calendar day buttons, so screen
 * readers announce the complete date instead of a bare day number.
 *
 * @param {string | undefined} localeId - The locale identifier used to format the label.
 * @param {Date} date - The date to format.
 * @return {string} The full localized date label.
 */
export function getFullDateLabel(localeId: string | undefined, date: Date): string {
  return new Intl.DateTimeFormat(localeId, { dateStyle: 'full' }).format(date);
}

/**
 * Checks whether a given date falls within any of the visible months
 * starting from a base date across a specified number of months.
 *
 * @param {Date} date - The date to check.
 * @param {Date} currentDate - The base date representing the first visible month.
 * @param {number} numberOfMonths - The number of months visible from the base date.
 * @return {boolean} True if the date's month and year match any of the visible months.
 */
export function isDateInVisibleMonths(
  date: Date,
  currentDate: Date,
  numberOfMonths: number,
): boolean {
  for (let i = 0; i < numberOfMonths; i++) {
    const panelDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    if (
      date.getMonth() === panelDate.getMonth() &&
      date.getFullYear() === panelDate.getFullYear()
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Returns an ordered array of month and year parts for the given date,
 * respecting the locale's natural ordering.
 *
 * For example, in 'en-US': [{ type: 'month', value: 'March' }, { type: 'year', value: '2026' }]
 * In 'ja-JP': [{ type: 'year', value: '2026' }, { type: 'month', value: '3月' }]
 *
 * @param {string | undefined} localeId - The locale identifier used to format the parts.
 * @param {Date} date - The date from which month and year will be extracted.
 * @param {'numeric' | '2-digit' | 'long' | 'short' | 'narrow'} monthFormat - The format style for the month portion.
 * @return {{ type: string; value: string }[]} An array of month and year parts in locale order.
 */
export function getMonthYearParts(
  localeId: string | undefined,
  date: Date,
  monthFormat: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow' = 'long',
): { type: string; value: string }[] {
  const formatter = new Intl.DateTimeFormat(localeId, { month: monthFormat, year: 'numeric' });
  return formatter.formatToParts(date).filter((p) => p.type === 'month' || p.type === 'year');
}

/**
 * Retrieves the numeric day label from a given date formatted based on the specified locale.
 *
 * @param {string | undefined} localeId - The locale identifier to format the day. Defaults to 'en-US' if not provided or undefined.
 * @param {Date} date - The date object from which the day label is retrieved.
 * @return {string} The numeric day label as a string based on the locale format.
 */
export function getDayLabel(localeId: string | undefined, date: Date): string {
  const locale = localeId || 'en-US';
  const formatter = new Intl.DateTimeFormat(locale, { day: 'numeric' });
  const parts = formatter.formatToParts(date);
  const dayPart = parts.find((part) => part.type === 'day');

  return dayPart ? dayPart.value : date.getDate().toString();
}

/**
 * Creates a DateRange object from two Date instances.
 * If both dates represent the same day, only the start property is set.
 *
 * @param {Date} start - The start date of the range.
 * @param {Date} end - The end date of the range.
 * @return {DateRange} A DateRange with start and optionally end.
 */
export function createDateRange(start: Date, end: Date): DateRange {
  const sStr = toISODateString(start);
  const eStr = toISODateString(end);

  // It's one date or a range of dates
  return sStr === eStr ? { start: sStr } : { start: sStr, end: eStr };
}

/**
 * Merges overlapping or adjacent date ranges into a single range.
 *
 * @param {DateRange[]} ranges - An array of date ranges to merge.
 * @return {DateRange[]} An array of merged, non-overlapping date ranges sorted by start date.
 */
export function mergeDateRanges(ranges: DateRange[]): DateRange[] {
  if (!ranges.length) return [];

  // Sort dates by "start"
  const sorted = ranges
    .map((r) => ({
      start: parseISODateString(r.start).getTime(),
      end: parseISODateString(r.end ?? r.start).getTime(),
    }))
    .sort((a, b) => a.start - b.start);

  const merged = sorted.reduce(
    (acc, next) => {
      const current = acc[acc.length - 1];

      // We ignore the first element
      if (current) {
        const currentEndDate = new Date(current.end);
        currentEndDate.setDate(currentEndDate.getDate() + 1);

        // Dates are overlapping, so we extend the "end"
        if (next.start <= currentEndDate.getTime()) {
          current.end = Math.max(current.end, next.end);
          return acc;
        }
      }

      return [...acc, next];
    },
    [] as { start: number; end: number }[],
  );

  return merged.map((m) => createDateRange(new Date(m.start), new Date(m.end)));
}
