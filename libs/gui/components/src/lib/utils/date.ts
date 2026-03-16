import { weekInfoData } from './week-info';

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
  const localeData = weekInfoData[localeId ?? 'en'] || { firstDay: 0 };
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
