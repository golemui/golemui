/**
 * The value as a range with both ends, or undefined. The single range elements hold one range with
 * both ends or nothing, so a partial or malformed value set from outside reads as empty.
 *
 * @param {unknown} value - A value set on the element.
 * @return {{ start: string; end: string } | undefined} The range when both ends are set.
 */
export function completeRange(value: unknown): { start: string; end: string } | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const { start, end } = value as { start?: unknown; end?: unknown };
  return typeof start === 'string' && start && typeof end === 'string' && end
    ? { start, end }
    : undefined;
}

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

/** Two parsed endpoints, resolved: ordered and validated, or why they are not a range yet. */
export type RangeEndpointsResult<V> =
  | { kind: 'incomplete' }
  | { kind: 'invalid'; message: string }
  | { kind: 'complete'; value: OrderedEndpoints<V> };

/** How two parsed endpoints become an ordered, validated pair. */
export interface ResolveRangeOptions<V> {
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
}

/** The outcome of a range commit attempt. */
export type RangeCommitResult<R> =
  | { kind: 'incomplete' }
  | { kind: 'invalid'; message: string }
  | { kind: 'commit'; value: R[] };

export interface CommitRangeOptions<V, R> extends ResolveRangeOptions<V> {
  /** Builds the range object appended to the existing ranges. */
  toRange: (ordered: OrderedEndpoints<V>) => R;
  /** Normalizes the appended list. */
  merge: (ranges: R[]) => R[];
}

/**
 * Orders two endpoint values by a comparator, swapping when the end sorts
 * before the start.
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
 * Resolves two parsed endpoints into one ordered, validated pair.
 *
 * @param {RangeEndpoint<V>} start - The parsed start group.
 * @param {RangeEndpoint<V>} end - The parsed end group.
 * @param {ResolveRangeOptions<V>} options - The widget-specific policies.
 * @return {RangeEndpointsResult<V>} 'invalid' with the winning message, or
 *   'incomplete', or 'complete' with the ordered pair.
 */
export function resolveRangeEndpoints<V>(
  start: RangeEndpoint<V>,
  end: RangeEndpoint<V>,
  options: ResolveRangeOptions<V> = {},
): RangeEndpointsResult<V> {
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

  return { kind: 'complete', value: ordered };
}

/**
 * Attempts to commit two parsed endpoints as a new range.
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
  const resolved = resolveRangeEndpoints(start, end, options);
  if (resolved.kind !== 'complete') return resolved;

  const merged = options.merge([...(existing ?? []), options.toRange(resolved.value)]);
  return { kind: 'commit', value: merged };
}
