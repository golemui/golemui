/**
 * The shared commit skeleton of the three range inputs' `tryCreatePill`
 * implementations (`range-date-input.ts`, `range-time-input.ts`,
 * `range-date-time-input.ts`), as one pure, generic pipeline:
 *
 * 1. An 'invalid' endpoint rejects the commit immediately — BEFORE the
 *    completeness check, and with the start group's message taking precedence
 *    over the end group's (both orderings match all three originals).
 * 2. Unless both endpoints are 'valid', the commit is 'incomplete' (the
 *    callers then wait for the rest of the range, clearing any previously
 *    surfaced error).
 * 3. Both valid: the endpoints are ordered by the caller-supplied `order`
 *    policy (swap for the date and date-time inputs, identity for the time
 *    input which rejects reversed ranges instead), then run through the
 *    optional `validate` hook, then merged into the existing ranges via the
 *    caller-supplied `toRange` + `merge` functions.
 *
 * Overlap/order rejection lives in the `validate` hook, NOT in the core: the
 * three originals diverge exactly there — `range-date-input` accepts any
 * ordered pair, `range-time-input` rejects `end <= start` and ranges
 * overlapping a disabled range, `range-date-time-input` swaps and then rejects
 * overlaps with `dateTimeRangeOverlaps`. Keeping the core shape-only and
 * pushing those checks into a hook reproduces each behavior without the core
 * knowing about clocks or calendars.
 *
 * Event policy (surfaceInputError vs plain inputError vs clearing) also stays
 * with the callers — this module only decides WHAT happened, not how to
 * announce it. In particular, `range-time-input` surfaces a bounds violation
 * while parsing an endpoint and then treats that endpoint as incomplete; its
 * caller maps such endpoints to `{ kind: 'incomplete' }` here.
 */

/** One parsed endpoint (start or end group) of a range commit. */
export type RangeEndpoint<V> =
  | { kind: 'incomplete' }
  | { kind: 'invalid'; message: string }
  | { kind: 'valid'; value: V };

/** An ordered pair of endpoint values, start <= end per the order policy. */
export interface OrderedEndpoints<V> {
  start: V;
  end: V;
}

/** The outcome of a range commit attempt. */
export type RangeCommitResult<R> =
  | { kind: 'incomplete' }
  | { kind: 'invalid'; message: string }
  | { kind: 'commit'; value: R[] };

export interface CommitRangeOptions<V, R> {
  /**
   * Orders the two endpoint values. Omitted: identity (the time input's
   * policy — a reversed pair is left for `validate` to reject). Use
   * {@link orderEndpoints} for the swap policy of the date/date-time inputs.
   */
  order?: (start: V, end: V) => OrderedEndpoints<V>;
  /**
   * Rejects an ordered pair with an error message (range-order violations,
   * disabled-range overlaps), or null to accept. Runs after `order`.
   */
  validate?: (ordered: OrderedEndpoints<V>) => string | null;
  /** Builds the range object appended to the existing ranges. */
  toRange: (ordered: OrderedEndpoints<V>) => R;
  /** Normalizes the appended list (the widgets' mergeXxxRanges functions). */
  merge: (ranges: R[]) => R[];
}

/**
 * Orders two endpoint values by a comparator, swapping when the end sorts
 * before the start — the reorder-not-reject policy of `range-date-input`
 * (Date getTime comparison) and `orderDateTimeRange`.
 *
 * @param {V} start - The entered start value.
 * @param {V} end - The entered end value.
 * @param {(a: V, b: V) => number} compare - Negative when a < b.
 * @return {OrderedEndpoints<V>} The pair with start <= end.
 */
export function orderEndpoints<V>(
  start: V,
  end: V,
  compare: (a: V, b: V) => number,
): OrderedEndpoints<V> {
  return compare(end, start) < 0 ? { start: end, end: start } : { start, end };
}

/**
 * Attempts to commit two parsed endpoints as a new range. See the module doc
 * for the exact precedence rules extracted from the three `tryCreatePill`
 * implementations.
 *
 * @param {RangeEndpoint<V>} start - The parsed start group.
 * @param {RangeEndpoint<V>} end - The parsed end group.
 * @param {R[] | undefined} existing - The current ranges (`value ?? []`).
 * @param {CommitRangeOptions<V, R>} options - The widget-specific policies.
 * @return {RangeCommitResult<R>} 'invalid' with the winning message, or
 *   'incomplete', or 'commit' with the merged range list.
 */
export function commitRange<V, R>(
  start: RangeEndpoint<V>,
  end: RangeEndpoint<V>,
  existing: R[] | undefined,
  options: CommitRangeOptions<V, R>,
): RangeCommitResult<R> {
  // A completed-but-rejected group is surfaced right away, start's message
  // first — checked before completeness, matching all three originals.
  if (start.kind === 'invalid') return { kind: 'invalid', message: start.message };
  if (end.kind === 'invalid') return { kind: 'invalid', message: end.message };

  // Not both complete yet: wait for the rest of the range.
  if (start.kind !== 'valid' || end.kind !== 'valid') return { kind: 'incomplete' };

  const ordered = options.order
    ? options.order(start.value, end.value)
    : { start: start.value, end: end.value };

  const validationError = options.validate?.(ordered) ?? null;
  if (validationError !== null) return { kind: 'invalid', message: validationError };

  const merged = options.merge([...(existing ?? []), options.toRange(ordered)]);
  return { kind: 'commit', value: merged };
}
