import { describe, expect, it, vi } from 'vitest';
import { filterMap, filterReduce, filterTap, SKIP, zipEvery } from './array';

describe('array utils', () => {
  describe('filterMap', () => {
    it('maps and filters values in a single pass', () => {
      const result = filterMap([1, 2, 3, 4], (n) => (n % 2 === 0 ? n * 10 : SKIP));

      expect(result).toEqual([20, 40]);
    });

    it('preserves falsy but valid values', () => {
      const result = filterMap([0, 1, 2], (n) => (n === 0 ? 0 : SKIP));

      expect(result).toEqual([0]);
    });

    it('returns an empty array when all values are skipped', () => {
      const result = filterMap([1, 2, 3], () => SKIP);

      expect(result).toEqual([]);
    });

    it('returns an empty array for an empty input', () => {
      const result = filterMap([], () => SKIP);

      expect(result).toEqual([]);
    });

    it('passes correct arguments to the mapping function', () => {
      const calls: Array<[number, number, readonly number[]]> = [];

      filterMap([10, 20, 30], (value, index, array) => {
        calls.push([value, index, array]);
        return SKIP;
      });

      expect(calls).toEqual([
        [10, 0, [10, 20, 30]],
        [20, 1, [10, 20, 30]],
        [30, 2, [10, 20, 30]],
      ]);
    });

    it('produces a correctly typed output', () => {
      const result = filterMap([1, 2, 3], (n) => (n > 1 ? String(n) : SKIP));

      // compile-time check: result is string[]
      const typed: string[] = result;
      expect(typed).toEqual(['2', '3']);
    });

    it('does not include the SKIP marker in the output', () => {
      const result = filterMap([1], () => SKIP);

      expect(result.includes(SKIP as unknown as never)).toBe(false);
    });
  });

  describe('filterTap', () => {
    it('should execute the callback only for elements that pass the predicate', () => {
      const array = [1, 2, 3, 4, 5];
      const callback = vi.fn();

      filterTap(array, (n) => n % 2 === 0, callback);

      // Should only have been called for 2 and 4
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(1, 2, 1, array);
      expect(callback).toHaveBeenNthCalledWith(2, 4, 3, array);
    });

    it('should pass value, index, and the original array to both predicate and callback', () => {
      const array = ['a', 'b', 'c'];
      const predicate = vi.fn((val: string) => val !== 'b');
      const callback = vi.fn();

      filterTap(array, predicate, callback);

      // Check predicate arguments
      expect(predicate).toHaveBeenCalledTimes(3);
      expect(predicate).toHaveBeenNthCalledWith(1, 'a', 0, array);
      expect(predicate).toHaveBeenNthCalledWith(2, 'b', 1, array);
      expect(predicate).toHaveBeenNthCalledWith(3, 'c', 2, array);

      // Check callback arguments (skips 'b' at index 1)
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(1, 'a', 0, array);
      expect(callback).toHaveBeenNthCalledWith(2, 'c', 2, array);
    });

    it('should not execute the callback if the array is empty', () => {
      const predicate = vi.fn().mockReturnValue(true);
      const callback = vi.fn();

      filterTap([], predicate, callback);

      expect(predicate).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not execute the callback if no elements pass the predicate', () => {
      const array = [1, 3, 5];
      const callback = vi.fn();

      filterTap(
        array,
        (n) => n % 2 === 0, // No evens in the array
        callback,
      );

      expect(callback).not.toHaveBeenCalled();
    });

    it('should narrow types successfully when using a type guard', () => {
      const array: (number | string)[] = [1, 'two', 3, 'four'];
      const callback = vi.fn();

      // Type guard function
      const isString = (val: unknown): val is string => typeof val === 'string';

      // The callback's parameter `s` is correctly inferred as `string` here
      filterTap(array, isString, (s, index, arr) => {
        // TypeScript allows string methods because of the `S extends T` overload
        callback(s.toUpperCase(), index, arr);
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(1, 'TWO', 1, array);
      expect(callback).toHaveBeenNthCalledWith(2, 'FOUR', 3, array);
    });
  });

  describe('filterReduce', () => {
    it('should filter and reduce an array in a single pass', () => {
      const array = [1, 2, 3, 4, 5];
      const predicate = vi.fn((n: number) => n % 2 === 0);
      const reducer = vi.fn((acc: number, n: number) => acc + n);

      const result = filterReduce(array, predicate, reducer, 0);

      // 2 + 4 = 6
      expect(result).toBe(6);

      // Predicate called for every element
      expect(predicate).toHaveBeenCalledTimes(5);

      // Reducer called only for elements that passed the predicate (2 and 4)
      expect(reducer).toHaveBeenCalledTimes(2);
    });

    it('should return the initial value if the array is empty', () => {
      const predicate = vi.fn().mockReturnValue(true);
      const reducer = vi.fn();

      const result = filterReduce([], predicate, reducer, 100);

      expect(result).toBe(100);
      expect(predicate).not.toHaveBeenCalled();
      expect(reducer).not.toHaveBeenCalled();
    });

    it('should return the initial value if no elements pass the predicate', () => {
      const array = [1, 3, 5]; // No evens
      const predicate = vi.fn((n: number) => n % 2 === 0);
      const reducer = vi.fn();

      const result = filterReduce(array, predicate, reducer, 10);

      expect(result).toBe(10);
      expect(predicate).toHaveBeenCalledTimes(3);
      expect(reducer).not.toHaveBeenCalled(); // Reducer should never execute
    });

    it('should pass the correct index and original array to predicate and reducer', () => {
      const array = [10, 20, 30];
      const predicate = vi.fn((n: number) => n >= 20);
      const reducer = vi.fn((acc: number[], n: number) => [...acc, n]);

      filterReduce(array, predicate, reducer, []);

      // Check predicate args for the first element
      expect(predicate).toHaveBeenNthCalledWith(1, 10, 0, array);
      // Check predicate args for the second element
      expect(predicate).toHaveBeenNthCalledWith(2, 20, 1, array);

      // Check reducer args for the first passing element (20 at index 1)
      expect(reducer).toHaveBeenNthCalledWith(1, [], 20, 1, array);
      // Check reducer args for the second passing element (30 at index 2)
      expect(reducer).toHaveBeenNthCalledWith(2, [20], 30, 2, array);
    });

    it('should narrow types successfully when using a type guard', () => {
      const array: (number | string)[] = [1, 'hello', 2, 'world'];

      // Type guard
      const isString = (val: unknown): val is string => typeof val === 'string';

      // `str` is correctly inferred as a `string` inside the reducer
      const result = filterReduce(array, isString, (acc, str) => acc + str.toUpperCase() + ' ', '');

      expect(result).toBe('HELLO WORLD ');
    });
  });

  describe('zipEvery', () => {
    it('returns true when both arrays are empty', () => {
      const result = zipEvery([], [], () => true);
      expect(result).toBe(true);
    });

    it('returns false when array lengths differ', () => {
      const result = zipEvery([1, 2], [1], () => true);
      expect(result).toBe(false);
    });

    it('returns true when all element pairs satisfy the predicate', () => {
      const result = zipEvery([1, 2, 3], [1, 2, 3], (a, b) => a === b);

      expect(result).toBe(true);
    });

    it('returns false when any element pair fails the predicate', () => {
      const result = zipEvery([1, 2, 3], [1, 999, 3], (a, b) => a === b);

      expect(result).toBe(false);
    });

    it('short-circuits on the first predicate failure', () => {
      let calls = 0;

      const result = zipEvery([1, 2, 3, 4], [1, 0, 0, 0], (a, b) => {
        calls++;
        return a === b;
      });

      expect(result).toBe(false);
      expect(calls).toBe(2);
    });

    it('passes correct arguments to the predicate', () => {
      const calls: Array<[number, number, number, readonly number[], readonly number[]]> = [];

      zipEvery([10, 20], [10, 20], (a, b, index, arrA, arrB) => {
        calls.push([a, b, index, arrA, arrB]);
        return true;
      });

      expect(calls).toEqual([
        [10, 10, 0, [10, 20], [10, 20]],
        [20, 20, 1, [10, 20], [10, 20]],
      ]);
    });

    it('does not call the predicate when lengths differ', () => {
      let called = false;

      const result = zipEvery([1], [1, 2], () => {
        called = true;
        return true;
      });

      expect(result).toBe(false);
      expect(called).toBe(false);
    });

    it('works with different element types', () => {
      const result = zipEvery([1, 2, 3], ['1', '2', '3'], (a, b) => String(a) === b);

      expect(result).toBe(true);
    });
  });
});
