import type { DateTimeRange, DisabledTimeRange } from '@golemui/gui-shared/internals';
import { parseISODateString } from './date';
import { INVALID_MAX_DATE_TIME_MESSAGE, INVALID_MIN_DATE_TIME_MESSAGE } from './messages';

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
 * A time-of-day range; both ends are ISO time strings (HH:mm or HH:mm:ss).
 */
export interface TimeRange {
  start: string;
  end: string;
}

/** A selectable time slot as consumed by the time picker list. */
export interface TimeOption {
  value: string;
  disabled: boolean;
}

export const NO_AVAILABLE_TIMES_MESSAGE = 'No available times';

/**
 * Compares two ISO time strings chronologically. HH:mm values are normalized
 * to HH:mm:ss so the comparison stays lexicographic like the calendar's
 * ISO date comparisons.
 *
 * @param {string} a - The first ISO time string.
 * @param {string} b - The second ISO time string.
 * @return {number} Negative when a < b, 0 when equal, positive when a > b.
 */
export function compareISOTimes(a: string, b: string): number {
  const normalize = (value: string) => (value.length === 5 ? `${value}:00` : value);
  const left = normalize(a);
  const right = normalize(b);
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * Returns the ISO time one `minuteStep` after `iso`, or `undefined` when that
 * would spill past the end of the day.
 *
 * @param {string} iso - The anchor ISO time (HH:mm or HH:mm:ss).
 * @param {number | undefined} minuteStep - Slot size; defaults to 30 (matches
 *   `buildTimeOptions`). `|| 30` guards the 0 some framework bindings coerce.
 * @return {string | undefined} The next slot's ISO time, or undefined at day end.
 */
export function oneStepAfterISOTime(iso: string, minuteStep?: number): string | undefined {
  const time = parseISOTimeString(iso);
  if (!time) return undefined;
  const total = time.hours * 60 + time.minutes + (minuteStep || 30);
  if (total >= 24 * 60) return undefined;
  return toISOTimeString(new Date(1970, 0, 1, Math.floor(total / 60), total % 60, 0));
}

/**
 * Resolves day-scoped disabled time ranges to the plain ranges applying on a
 * given date. An entry scopes with `date` (exact ISO date) and/or `weekdays`
 * (Date.prototype.getDay() numbers, 0=Sunday); provided scopes must all
 * match, and an unscoped entry applies every day.
 *
 * @param {DisabledTimeRange[] | undefined} entries - The scoped ranges.
 * @param {string} isoDate - The date (YYYY-MM-DD) to resolve for.
 * @return {TimeRange[]} The plain ranges in effect on that date.
 */
export function resolveDisabledTimeRangesForDate(
  entries: DisabledTimeRange[] | undefined,
  isoDate: string,
): TimeRange[] {
  if (!entries?.length) return [];

  const weekday = parseISODateString(isoDate).getDay();

  return entries
    .filter(
      (entry) =>
        (entry.date == null || entry.date === isoDate) &&
        (entry.weekdays == null || entry.weekdays.includes(weekday)),
    )
    .map(({ start, end }) => ({ start, end }));
}

/**
 * Determines whether a time falls inside any of the given disabled ranges.
 * Both range ends are inclusive, mirroring the calendar's disabledRanges.
 *
 * @param {string} time - The ISO time string to test.
 * @param {TimeRange[] | undefined} ranges - The disabled ranges.
 * @return {boolean} True when the time is disabled.
 */
export function isTimeDisabled(time: string, ranges: TimeRange[] | undefined): boolean {
  if (!ranges?.length) return false;
  return ranges.some(
    (range) =>
      compareISOTimes(time, range.start) >= 0 &&
      compareISOTimes(time, range.end ?? range.start) <= 0,
  );
}

/**
 * Determines whether a selected time range `[start, end]` overlaps any disabled
 * range. Unlike {@link isTimeDisabled} (which only tests a single instant), this
 * catches a span that *straddles* a disabled block — e.g. picking 12:00–18:00
 * when 13:00–14:00 is disabled, where neither endpoint is itself disabled. Two
 * closed intervals overlap when each starts on or before the other ends. Both
 * range ends are inclusive, matching the disabled-slot semantics of the lists.
 *
 * @param {string} start - The selected range start (ISO time).
 * @param {string | undefined} end - The selected range end (ISO time); defaults to `start`.
 * @param {TimeRange[] | undefined} ranges - The disabled ranges.
 * @return {boolean} True when the selected range overlaps a disabled range.
 */
export function isTimeRangeDisabled(
  start: string,
  end: string | undefined,
  ranges: TimeRange[] | undefined,
): boolean {
  if (!ranges?.length) return false;
  const rangeEnd = end ?? start;
  return ranges.some((range) => {
    const disabledEnd = range.end ?? range.start;
    return compareISOTimes(start, disabledEnd) <= 0 && compareISOTimes(range.start, rangeEnd) <= 0;
  });
}

/** Normalizes an ISO time to HH:mm:ss so merged output is consistent. */
function normalizeISOTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

/**
 * Merges overlapping or touching time-of-day ranges into a minimal set, sorted
 * by start. Unlike {@link mergeDateRanges} there is no adjacency bump: time is
 * continuous, so ranges merge only when they overlap or exactly touch
 * (`next.start <= current.end`). Both ends stay inclusive ISO times.
 *
 * @param {TimeRange[]} ranges - The time ranges to merge.
 * @return {TimeRange[]} Merged, non-overlapping ranges sorted by start.
 */
export function mergeTimeRanges(ranges: TimeRange[]): TimeRange[] {
  if (!ranges.length) return [];

  const sorted = ranges
    .map((r) => ({ start: normalizeISOTime(r.start), end: normalizeISOTime(r.end ?? r.start) }))
    .sort((a, b) => compareISOTimes(a.start, b.start));

  const merged: TimeRange[] = [];
  for (const next of sorted) {
    const current = merged[merged.length - 1];
    if (current && compareISOTimes(next.start, current.end) <= 0) {
      if (compareISOTimes(next.end, current.end) > 0) current.end = next.end;
    } else {
      merged.push({ ...next });
    }
  }
  return merged;
}

/**
 * Orders a date-time range so `start <= end`, swapping the two ends when the
 * caller provided them reversed. Date-time ranges are just two ISO date-times,
 * so a "backward" selection (e.g. same day, end time before start time) is
 * reordered rather than rejected — mirroring the range calendar's date swap.
 *
 * @param {string} start - The (possibly-later) start date-time.
 * @param {string} end - The (possibly-earlier) end date-time.
 * @return {DateTimeRange} The ordered range.
 */
export function orderDateTimeRange(start: string, end: string): DateTimeRange {
  return parseISODateTimeString(start).getTime() <= parseISODateTimeString(end).getTime()
    ? { start, end }
    : { start: end, end: start };
}

/**
 * Merges overlapping or touching date-time ranges into a minimal set, sorted by
 * start. Comparison is on the full local date-time (millis), so this single
 * pass implements "several times in one day → separate pills unless they
 * overlap" and "a range spanning midnight → one pill" with no special-casing.
 *
 * @param {DateTimeRange[]} ranges - The date-time ranges to merge.
 * @return {DateTimeRange[]} Merged, non-overlapping ranges sorted by start.
 */
export function mergeDateTimeRanges(ranges: DateTimeRange[]): DateTimeRange[] {
  if (!ranges.length) return [];

  const sorted = ranges
    .map((r) => ({
      start: parseISODateTimeString(r.start).getTime(),
      end: parseISODateTimeString(r.end ?? r.start).getTime(),
    }))
    .sort((a, b) => a.start - b.start);

  const merged: { start: number; end: number }[] = [];
  for (const next of sorted) {
    const current = merged[merged.length - 1];
    if (current && next.start <= current.end) {
      if (next.end > current.end) current.end = next.end;
    } else {
      merged.push({ start: next.start, end: next.end });
    }
  }

  return merged.map((m) => ({
    start: toISODateTimeString(new Date(m.start)),
    end: toISODateTimeString(new Date(m.end)),
  }));
}

/**
 * Whether a date-time range overlaps any of the given absolute instant spans.
 *
 * @param {DateTimeRange} range - The range to test.
 * @param {DateTimeRange[] | undefined} spans - The disabled instant spans.
 * @return {boolean} True when the range overlaps at least one span.
 */
export function dateTimeRangeOverlaps(
  range: DateTimeRange,
  spans: DateTimeRange[] | undefined,
): boolean {
  if (!spans?.length) return false;
  const start = parseISODateTimeString(range.start).getTime();
  const end = parseISODateTimeString(range.end ?? range.start).getTime();
  return spans.some((span) => {
    const spanStart = parseISODateTimeString(span.start).getTime();
    const spanEnd = parseISODateTimeString(span.end ?? span.start).getTime();
    return start < spanEnd && spanStart < end;
  });
}

/**
 * Whether some span covers an entire calendar day.
 *
 * @param {string} isoDay - The day (YYYY-MM-DD) to test.
 * @param {DateTimeRange[] | undefined} spans - The disabled instant spans.
 * @return {boolean} True when a span covers the whole day.
 */
export function isDayFullyBlocked(isoDay: string, spans: DateTimeRange[] | undefined): boolean {
  if (!spans?.length) return false;
  const dayStart = parseISODateTimeString(`${isoDay}T00:00:00`).getTime();
  const dayEnd = parseISODateTimeString(`${isoDay}T23:59:59`).getTime();
  return spans.some((span) => {
    const spanStart = parseISODateTimeString(span.start).getTime();
    const spanEnd = parseISODateTimeString(span.end ?? span.start).getTime();
    return spanStart <= dayStart && spanEnd >= dayEnd;
  });
}

/**
 * Clips absolute instant spans to a single day's clock, so a time list can grey
 * the affected slots.
 *
 * @param {DateTimeRange[] | undefined} spans - The disabled instant spans.
 * @param {string} isoDay - The day (YYYY-MM-DD) to resolve for.
 * @return {TimeRange[]} The plain clock ranges disabled on that day.
 */
export function resolveDisabledTimesForDate(
  spans: DateTimeRange[] | undefined,
  isoDay: string,
): TimeRange[] {
  if (!spans?.length) return [];
  const dayStart = parseISODateTimeString(`${isoDay}T00:00:00`).getTime();
  const dayEnd = parseISODateTimeString(`${isoDay}T23:59:59`).getTime();

  const ranges: TimeRange[] = [];
  for (const span of spans) {
    const spanStart = parseISODateTimeString(span.start).getTime();
    const spanEnd = parseISODateTimeString(span.end ?? span.start).getTime();
    if (spanEnd < dayStart || spanStart > dayEnd) continue;
    const start = spanStart <= dayStart ? '00:00:00' : toISOTimeString(new Date(spanStart));
    const end = spanEnd >= dayEnd ? '23:59:59' : toISOTimeString(new Date(spanEnd));
    ranges.push({ start, end });
  }
  return ranges;
}

/**
 * Builds the selectable time slots for a time picker: whole-minute slots
 * anchored at minTime's HH:mm, stepping by minuteStep while inside
 * [minTime, maxTime] (both bounds inclusive), each slot flagged as disabled
 * when it falls inside a disabled range. When minTime carries seconds the
 * anchor slot itself falls before minTime and is excluded.
 *
 * @param {object} options - The generation options.
 * @param {string} [options.minTime] - Lower bound (ISO time). Defaults to '00:00:00'.
 * @param {string} [options.maxTime] - Upper bound (ISO time). Defaults to '23:59:59'.
 * @param {number} [options.minuteStep] - Minutes between slots. Defaults to 30.
 * @param {TimeRange[]} [options.disabledRanges] - Ranges rendered as disabled.
 * @return {TimeOption[]} The ordered slots.
 */
export function buildTimeOptions(options: {
  minTime?: string;
  maxTime?: string;
  minuteStep?: number;
  disabledRanges?: TimeRange[];
}): TimeOption[] {
  // `|| 30` (not ??): some framework bindings coerce an absent number prop
  // to 0 (e.g. Vue's patchDOMProp), and a 0 step would loop forever
  const step = options.minuteStep || 30;
  const min = parseISOTimeString(options.minTime ?? '') ?? { hours: 0, minutes: 0, seconds: 0 };
  const minTime = toISOTimeString(new Date(1970, 0, 1, min.hours, min.minutes, min.seconds));
  const maxTime = options.maxTime ?? '23:59:59';

  const slots: TimeOption[] = [];
  for (
    let totalMinutes = min.hours * 60 + min.minutes;
    totalMinutes < 24 * 60;
    totalMinutes += step
  ) {
    const value = toISOTimeString(
      new Date(1970, 0, 1, Math.floor(totalMinutes / 60), totalMinutes % 60, 0),
    );
    if (compareISOTimes(value, maxTime) > 0) break;
    if (compareISOTimes(value, minTime) < 0) continue;
    slots.push({ value, disabled: isTimeDisabled(value, options.disabledRanges) });
  }
  return slots;
}

/**
 * Formats an ISO time string as the locale's display label (e.g. '09:30 AM'
 * for 'en-US', '09:30' for 'en-GB').
 *
 * @param {string} isoTime - The ISO time string (HH:mm or HH:mm:ss).
 * @param {string | undefined} localeId - The locale identifier. Defaults to 'en'.
 * @param {HourFormat} hourFormat - The effective hour format.
 * @return {string} The localized label, or the input when it cannot be parsed.
 */
export function formatISOTimeForLocale(
  isoTime: string,
  localeId: string | undefined,
  hourFormat: HourFormat,
): string {
  const time = parseISOTimeString(isoTime);
  if (!time) return isoTime;

  // 2-digit like formatISODateTimeForLocale, so pill and list labels match the
  // zero-padded segment inputs ('02:00 AM', not the locale's bare '2:00 AM').
  return new Intl.DateTimeFormat(localeId ?? 'en', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: hourFormat === '12' ? 'h12' : 'h23',
  }).format(new Date(2025, 0, 15, time.hours, time.minutes, time.seconds));
}

/**
 * Formats an ISO date-time for display, honouring the locale and hour format.
 * Returns the raw input when it cannot be parsed.
 *
 * @param {string} iso - The ISO date-time string.
 * @param {string | undefined} localeId - The locale identifier. Defaults to 'en'.
 * @param {HourFormat} hourFormat - The effective hour format.
 * @return {string} The localized label.
 */
export function formatISODateTimeForLocale(
  iso: string,
  localeId: string | undefined,
  hourFormat: HourFormat,
): string {
  const date = parseISODateTimeString(iso);
  if (isNaN(date.getTime())) return iso;

  return new Intl.DateTimeFormat(localeId ?? 'en', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: hourFormat === '12',
  }).format(date);
}

export interface DateTimeBoundsMessages {
  minDateTimeMessage?: string;
  maxDateTimeMessage?: string;
}

/**
 * Validates an ISO date-time against `minDateTime`/`maxDateTime` (both inclusive
 * instants) and returns the first violated bound's message, or null when in
 * range.
 *
 * @param {string} iso - The ISO date-time to test.
 * @param {string | undefined} minDateTime - Earliest allowed instant, inclusive.
 * @param {string | undefined} maxDateTime - Latest allowed instant, inclusive.
 * @param {DateTimeBoundsMessages} [messages] - Overrides for each bound message.
 * @return {string | null} The violated-bound message, or null.
 */
export function dateTimeBoundsError(
  iso: string,
  minDateTime: string | undefined,
  maxDateTime: string | undefined,
  messages?: DateTimeBoundsMessages,
): string | null {
  const time = parseISODateTimeString(iso).getTime();
  if (isNaN(time)) return null;

  if (minDateTime) {
    const min = parseISODateTimeString(minDateTime);
    if (!isNaN(min.getTime()) && time < min.getTime()) {
      return messages?.minDateTimeMessage ?? INVALID_MIN_DATE_TIME_MESSAGE;
    }
  }
  if (maxDateTime) {
    const max = parseISODateTimeString(maxDateTime);
    if (!isNaN(max.getTime()) && time > max.getTime()) {
      return messages?.maxDateTimeMessage ?? INVALID_MAX_DATE_TIME_MESSAGE;
    }
  }
  return null;
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
