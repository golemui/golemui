import { filterMap, SKIP, zipEvery } from './array';

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
