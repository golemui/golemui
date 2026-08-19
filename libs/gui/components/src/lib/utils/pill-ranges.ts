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
 * The list minus the range whose pill key matches — the base an in-place edit
 * commits against (replace = exclude the original, then append-and-merge).
 * Always a fresh copy; when no range matches, a copy of the input.
 *
 * @param {readonly R[] | undefined} ranges - The current ranges (`value ?? []`).
 * @param {string} key - The pill key of the range being replaced.
 * @return {R[]} The remaining ranges.
 */
export function excludeRangeByKey<R extends RangeLike>(
  ranges: readonly R[] | undefined,
  key: string,
): R[] {
  return removeRangeByKey(ranges, key)?.next ?? [...(ranges ?? [])];
}

/**
 * Whether two range lists hold the same spans in the same order. An edit
 * whose commit reproduces the current value is treated as a cancellation
 * (no `change` event), which is what this decides.
 *
 * @param {readonly R[] | undefined} a - One list (`value ?? []`).
 * @param {readonly R[] | undefined} b - The other list.
 * @return {boolean} True when both hold identical spans.
 */
export function sameRanges<R extends RangeLike>(
  a: readonly R[] | undefined,
  b: readonly R[] | undefined,
): boolean {
  const listA = a ?? [];
  const listB = b ?? [];
  return (
    listA.length === listB.length &&
    listA.every(
      (range, index) =>
        range.start === listB[index].start && (range.end ?? null) === (listB[index].end ?? null),
    )
  );
}

/**
 * Index (in the given order) of the first range whose `[start, end ?? start]`
 * span contains the endpoint, or -1. Used to find the pill that resulted from
 * an edit commit, whose range may have merged into a neighbor.
 *
 * @param {readonly R[]} sortedRanges - The ranges, already display-sorted.
 * @param {string} iso - The committed start endpoint.
 * @param {(a: string, b: string) => number} compare - Endpoint comparator.
 * @return {number} The containing range's index, or -1.
 */
export function indexOfRangeContaining<R extends RangeLike>(
  sortedRanges: readonly R[],
  iso: string,
  compare: (a: string, b: string) => number,
): number {
  return sortedRanges.findIndex(
    (range) => compare(iso, range.start) >= 0 && compare(iso, range.end ?? range.start) <= 0,
  );
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
export function formatRangeLabel(
  range: RangeLike,
  formatEndpoint: (iso: string) => string,
): string {
  const startLabel = formatEndpoint(range.start);
  const endLabel = range.end ? formatEndpoint(range.end) : startLabel;
  return `${startLabel} - ${endLabel}`;
}

/**
 * Maps sorted ranges to gui-pills items: endpoint key and display label. The
 * pill button is named by its label — the remove hint travels separately as
 * gui-pills' `removeAriaLabel` (announced as the button's description).
 *
 * @param {readonly R[]} sortedRanges - The ranges, already display-sorted.
 * @param {(range: R) => string} formatLabel - Range label formatter (e.g.
 *   {@link formatRangeLabel} partially applied with an endpoint formatter).
 * @return {PillItemShape[]} The pill items.
 */
export function buildPillItems<R extends RangeLike>(
  sortedRanges: readonly R[],
  formatLabel: (range: R) => string,
): PillItemShape[] {
  return sortedRanges.map((range) => {
    const label = formatLabel(range);
    return {
      key: rangeKey(range),
      label,
      ariaLabel: label,
    };
  });
}
