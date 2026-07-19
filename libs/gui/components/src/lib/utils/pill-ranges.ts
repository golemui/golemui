import { parseISODateString } from './date';

/** The structural shape all pill-backed ranges share. */
export interface RangeLike {
  start: string;
  end?: string;
}

/** A pill item as consumed by gui-pills (structural, no component import). */
export interface PillItemShape {
  key: string;
  label: string;
  ariaLabel: string;
}

/**
 * The identity key of a range's pill: `${start}-${end ?? start}` (an
 * open-ended range keys on its start twice).
 *
 * @param {RangeLike} range - The range.
 * @return {string} The pill key.
 */
export function rangeKey(range: RangeLike): string {
  return `${range.start}-${range.end ?? range.start}`;
}

/**
 * Returns a new array of ranges sorted by their start endpoint. Non-array or
 * missing input yields [] (matching the widgets' getSortedPills guards); the
 * input array is never mutated.
 *
 * @param {readonly R[] | undefined | null} ranges - The ranges to sort.
 * @param {(a: string, b: string) => number} compareStarts - Endpoint
 *   comparator; e.g. Date-parse difference for dates, `compareISOTimes` for
 *   times, date-time-parse difference for date-times.
 * @return {R[]} The sorted copy.
 */
export function sortRangesByStart<R extends RangeLike>(
  ranges: readonly R[] | undefined | null,
  compareStarts: (a: string, b: string) => number,
): R[] {
  if (!ranges || !Array.isArray(ranges)) return [];
  return [...ranges].sort((a, b) => compareStarts(a.start, b.start));
}

/**
 * Finds the range whose pill key matches, or undefined. Used by the pill
 * click/remove handlers to resolve an event key back to a range.
 *
 * @param {readonly R[]} ranges - The ranges to search.
 * @param {string} key - The pill key from the event detail.
 * @return {R | undefined} The matching range.
 */
export function findRangeByKey<R extends RangeLike>(
  ranges: readonly R[],
  key: string,
): R | undefined {
  return ranges.find((range) => rangeKey(range) === key);
}

/**
 * Removes the range matching a pill key. Returns null when no range matches.
 *
 * @param {readonly R[] | undefined} ranges - The current ranges (`value ?? []`).
 * @param {string} key - The pill key from the event detail.
 * @return {{ removed: R; next: R[] } | null} The removed range and remaining
 *   list, or null.
 */
export function removeRangeByKey<R extends RangeLike>(
  ranges: readonly R[] | undefined,
  key: string,
): { removed: R; next: R[] } | null {
  const list = ranges ?? [];
  const removed = findRangeByKey(list, key);
  if (!removed) return null;
  const next = list.filter(
    (range) => !(range.start === removed.start && (range.end ?? null) === (removed.end ?? null)),
  );
  return { removed, next };
}

/**
 * Formats an ISO date for pill display: numeric year with 2-digit month and
 * day in the locale's order.
 *
 * @param {string} iso - The ISO date (YYYY-MM-DD).
 * @param {string | undefined} localeId - The locale identifier. Defaults to 'en'.
 * @return {string} The localized label, or the input when unparseable.
 */
export function formatISODateForDisplay(iso: string, localeId: string | undefined): string {
  const date = parseISODateString(iso);
  if (isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(localeId ?? 'en', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * A pill's `start - end` label, formatting each endpoint with the supplied
 * function; an open-ended range repeats its formatted start (matching the
 * date and time inputs' `end ?? start` fallbacks).
 *
 * @param {RangeLike} range - The range to label.
 * @param {(iso: string) => string} formatEndpoint - Endpoint display formatter.
 * @return {string} The label.
 */
export function formatRangeLabel(range: RangeLike, formatEndpoint: (iso: string) => string): string {
  const startLabel = formatEndpoint(range.start);
  const endLabel = range.end ? formatEndpoint(range.end) : startLabel;
  return `${startLabel} - ${endLabel}`;
}

/**
 * Maps sorted ranges to gui-pills items: endpoint key, display label, and the
 * `"<removeAriaLabel> <label>"` aria label all four call sites build.
 *
 * @param {readonly R[]} sortedRanges - The ranges, already display-sorted.
 * @param {(range: R) => string} formatLabel - Range label formatter (e.g.
 *   {@link formatRangeLabel} partially applied with an endpoint formatter).
 * @param {string} removeAriaLabel - The resolved remove-label prefix (the
 *   caller applies its own `?? 'Remove date'`-style default).
 * @return {PillItemShape[]} The pill items.
 */
export function buildPillItems<R extends RangeLike>(
  sortedRanges: readonly R[],
  formatLabel: (range: R) => string,
  removeAriaLabel: string,
): PillItemShape[] {
  return sortedRanges.map((range) => {
    const label = formatLabel(range);
    return {
      key: rangeKey(range),
      label,
      ariaLabel: `${removeAriaLabel} ${label}`,
    };
  });
}
