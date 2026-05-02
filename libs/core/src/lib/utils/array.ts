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
 * Iterates over an array, executing a callback function only for elements
 * that satisfy the provided predicate.
 *
 * This combines `filter` and `forEach` in a single pass without allocating
 * intermediate arrays, improving performance and reducing garbage collection.
 *
 * @typeParam T - The type of the input array elements.
 * @typeParam S - A narrower type of the elements that pass a type guard predicate.
 *
 * @param array - The source array to iterate over.
 * @param predicate - A function that evaluates each element. If it returns truthy,
 * the callback is executed.
 * @param callback - A function to execute for each element that passes the predicate.
 *
 * @example
 * ```ts
 * filterTap(
 *   [1, 2, 3, 4],
 *   n => n % 2 === 0,
 *   n => console.log('Even:', n)
 * );
 * // "Even: 2", "Even: 4"
 * ```
 */
export function filterTap<T, S extends T>(
  array: readonly T[],
  predicate: (value: T, index: number, array: readonly T[]) => value is S,
  callback: (value: S, index: number, array: readonly T[]) => void,
): void;
export function filterTap<T>(
  array: readonly T[],
  predicate: (value: T, index: number, array: readonly T[]) => unknown,
  callback: (value: T, index: number, array: readonly T[]) => void,
): void;
export function filterTap<T>(
  array: readonly T[],
  predicate: (value: T, index: number, array: readonly T[]) => unknown,
  callback: (value: T, index: number, array: readonly T[]) => void,
): void {
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i], i, array)) {
      callback(array[i], i, array);
    }
  }
}

/**
 * Iterates over an array, filtering elements using a predicate, and
 * accumulating a single result using a reducer function.
 *
 * This combines `filter` and `reduce` in a single pass without allocating
 * intermediate arrays, improving performance and memory efficiency.
 *
 * @typeParam T - The type of the input array elements.
 * @typeParam S - A narrower type of the elements that pass a type guard predicate.
 * @typeParam U - The type of the accumulated value.
 *
 * @param array - The source array to iterate over.
 * @param predicate - A function that evaluates each element. If truthy, the element
 * is passed to the reducer.
 * @param reducer - A function that accumulates the results.
 * @param initialValue - The initial value to start the accumulation. Required to ensure
 * safety in cases where no elements pass the predicate.
 *
 * @returns The final accumulated value.
 *
 * @example
 * ```ts
 * const sumOfEvens = filterReduce(
 *   [1, 2, 3, 4, 5],
 *   n => n % 2 === 0,
 *   (acc, n) => acc + n,
 *   0
 * );
 * // sumOfEvens: 6
 * ```
 */
export function filterReduce<T, S extends T, U>(
  array: readonly T[],
  predicate: (value: T, index: number, array: readonly T[]) => value is S,
  reducer: (accumulator: U, currentValue: S, index: number, array: readonly T[]) => U,
  initialValue: U,
): U;
export function filterReduce<T, U>(
  array: readonly T[],
  predicate: (value: T, index: number, array: readonly T[]) => unknown,
  reducer: (accumulator: U, currentValue: T, index: number, array: readonly T[]) => U,
  initialValue: U,
): U;
export function filterReduce<T, U>(
  array: readonly T[],
  predicate: (value: T, index: number, array: readonly T[]) => unknown,
  reducer: (accumulator: U, currentValue: any, index: number, array: readonly T[]) => U,
  initialValue: U,
): U {
  let accumulator = initialValue;

  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i], i, array)) {
      accumulator = reducer(accumulator, array[i], i, array);
    }
  }

  return accumulator;
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
