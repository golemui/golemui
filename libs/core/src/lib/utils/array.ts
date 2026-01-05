/**
 * Unique marker value used to explicitly indicate that an element
 * should be skipped by {@link filterMap}.
 *
 * This is a stable singleton and does not allocate per iteration.
 */
export const SKIP: unique symbol = Symbol('filterMap.skip');

/**
 * Applies a mapping function to each element of an array and collects
 * only the values that are not {@link SKIP}.
 *
 * This combines `map` and `filter` in a single pass without allocating
 * intermediate arrays or sentinel objects.
 *
 * @typeParam T - The type of the input array elements.
 * @typeParam U - The type of the mapped output elements.
 *
 * @param array - The source array to iterate over.
 * @param fn - A function that maps each element to a value of type `U`,
 * or returns {@link SKIP} to exclude the element from the result.
 *
 * @returns A new array containing only the mapped values.
 *
 * @example
 * ```ts
 * const result = filterMap([1, 2, 3, 4], n =>
 *   n % 2 === 0 ? String(n) : SKIP
 * );
 * // result: ["2", "4"]
 * ```
 */
export function filterMap<T, U>(
  array: readonly T[],
  fn: (value: T, index: number, array: readonly T[]) => U | typeof SKIP,
): U[] {
  const result: U[] = [];

  for (let i = 0; i < array.length; i++) {
    const mapped = fn(array[i], i, array);
    if (mapped !== SKIP) {
      result.push(mapped);
    }
  }

  return result;
}

/**
 * Compares two arrays for structural equality by applying a predicate
 * to each pair of elements.
 *
 * The function:
 * - Fails fast if array lengths differ
 * - Iterates in a single pass
 * - Short-circuits immediately when the predicate returns `false`
 *
 * @param a - First array.
 * @param b - Second array.
 * @param predicate - A function invoked for each pair of elements.
 * It must return `true` if the elements are considered equal, or `false`
 * to terminate early and indicate inequality.
 *
 * @returns `true` if arrays are structurally equal according to the
 * predicate; otherwise `false`.
 *
 * @example
 * ```ts
 * const equal = zipEvery(
 *   [1, 2, 3],
 *   [1, 2, 3],
 *   (a, b) => a === b
 * );
 * // true
 * ```
 */
export function zipEvery<A, B>(
  a: readonly A[],
  b: readonly B[],
  predicate: (aValue: A, bValue: B, index: number, a: readonly A[], b: readonly B[]) => boolean,
): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (!predicate(a[i], b[i], i, a, b)) {
      return false;
    }
  }

  return true;
}
