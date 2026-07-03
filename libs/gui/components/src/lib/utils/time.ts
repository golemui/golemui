export type HourFormat = '12' | '24';

/** Fixed anchor so part ordering and literals are deterministic. */
const TIME_PARTS_ANCHOR = new Date(2025, 0, 15, 9, 5, 0);

/**
 * Resolves the effective hour format for a locale.
 *
 * @param {string | undefined} localeId - The locale identifier. Defaults to 'en'.
 * @param {HourFormat | undefined} override - Explicit format requested by the widget.
 * @return {HourFormat} '12' or '24'.
 */
export function resolveHourFormat(localeId: string | undefined, override?: HourFormat): HourFormat {
  if (override === '12' || override === '24') return override;

  // hourCycle is missing from the workspace TS lib's resolved options type
  const { hourCycle } = new Intl.DateTimeFormat(localeId ?? 'en', {
    hour: 'numeric',
  }).resolvedOptions() as Intl.ResolvedDateTimeFormatOptions & { hourCycle?: string };

  return hourCycle === 'h11' || hourCycle === 'h12' ? '12' : '24';
}

/**
 * Returns the locale-ordered time parts (hour, minute, dayPeriod and literal
 * separators) used to lay out segmented time inputs.
 *
 * @param {string | undefined} localeId - The locale identifier. Defaults to 'en'.
 * @param {HourFormat} hourFormat - The effective hour format.
 * @return {Intl.DateTimeFormatPart[]} The ordered parts, including literals.
 */
export function getTimeFormatParts(
  localeId: string | undefined,
  hourFormat: HourFormat,
): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat(localeId ?? 'en', {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: hourFormat === '12' ? 'h12' : 'h23',
  }).formatToParts(TIME_PARTS_ANCHOR);
}

/**
 * Returns the locale-ordered date-time parts (day, month, year, hour, minute,
 * dayPeriod and literal separators) used to lay out segmented date-time
 * inputs. A single formatToParts call yields the whole sequence in locale
 * order, including the literals between the date and time blocks (and e.g.
 * ko-KR placing the day period between them).
 *
 * @param {string | undefined} localeId - The locale identifier. Defaults to 'en'.
 * @param {HourFormat} hourFormat - The effective hour format.
 * @return {Intl.DateTimeFormatPart[]} The ordered parts, including literals.
 */
export function getDateTimeFormatParts(
  localeId: string | undefined,
  hourFormat: HourFormat,
): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat(localeId ?? 'en', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: hourFormat === '12' ? 'h12' : 'h23',
  }).formatToParts(TIME_PARTS_ANCHOR);
}

/**
 * Returns the locale's day period labels (e.g. { am: 'AM', pm: 'PM' } for
 * 'en-US', { am: 'a. m.', pm: 'p. m.' } for 'es-ES').
 *
 * @param {string | undefined} localeId - The locale identifier. Defaults to 'en'.
 * @return {{ am: string; pm: string }} The localized labels.
 */
export function getDayPeriodLabels(localeId: string | undefined): { am: string; pm: string } {
  const formatter = new Intl.DateTimeFormat(localeId ?? 'en', {
    hour: 'numeric',
    hourCycle: 'h12',
  });

  const labelAt = (hour: number) =>
    formatter
      .formatToParts(new Date(2025, 0, 15, hour, 0, 0))
      .find((part) => part.type === 'dayPeriod')?.value ?? '';

  return { am: labelAt(9) || 'AM', pm: labelAt(21) || 'PM' };
}

/**
 * Converts a Date object to a local ISO 8601 date-time string without a
 * timezone offset (YYYY-MM-DDTHH:mm:ss).
 *
 * @param {Date} date - The Date object to convert.
 * @return {string} The formatted local ISO date-time string.
 */
export function toISODateTimeString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Formats the time-of-day of a Date as an ISO 8601 time string (HH:mm:ss).
 *
 * @param {Date} date - The Date object whose time portion to format.
 * @return {string} The formatted time string.
 */
export function toISOTimeString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Parses an ISO 8601 time string (HH:mm or HH:mm:ss) into its numeric parts.
 * Date-time strings are not handled here; parse those with
 * parseISODateTimeString instead.
 *
 * @param {string} value - The time string to parse.
 * @return {{ hours: number; minutes: number; seconds: number } | null} The
 *   numeric parts, or null when the string is not a valid time.
 */
export function parseISOTimeString(
  value: string,
): { hours: number; minutes: number; seconds: number } | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(value);
  if (!match) return null;

  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
    seconds: Number(match[3] ?? 0),
  };
}

/**
 * Parses an ISO 8601 date-time string (YYYY-MM-DD[THH:mm[:ss]]) as local
 * time. Like parseISODateString, this avoids the UTC interpretation the
 * native parser applies to date-only strings; offset-less date-times are
 * wall-clock values. Other strings fall back to native parsing.
 *
 * @param {string} value - The ISO date-time string to parse.
 * @return {Date} The parsed Date anchored to the local timezone.
 */
export function parseISODateTimeString(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value);
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4] ?? 0),
      Number(match[5] ?? 0),
      Number(match[6] ?? 0),
    );
  }
  return new Date(value);
}

/**
 * Converts a 12-hour clock hour and day period to a 24-hour clock hour.
 * 12 AM maps to 0 and 12 PM maps to 12.
 *
 * @param {number} hour12 - The hour on a 12-hour clock (1-12).
 * @param {'am' | 'pm'} period - The day period.
 * @return {number} The hour on a 24-hour clock (0-23).
 */
export function to24Hour(hour12: number, period: 'am' | 'pm'): number {
  const base = hour12 % 12;
  return period === 'pm' ? base + 12 : base;
}

/**
 * Converts a 24-hour clock hour to a 12-hour clock hour and day period.
 * 0 maps to 12 AM and 12 maps to 12 PM.
 *
 * @param {number} hour24 - The hour on a 24-hour clock (0-23).
 * @return {{ hour12: number; period: 'am' | 'pm' }} The 12-hour clock equivalent.
 */
export function from24Hour(hour24: number): { hour12: number; period: 'am' | 'pm' } {
  const period = hour24 >= 12 ? 'pm' : 'am';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, period };
}
