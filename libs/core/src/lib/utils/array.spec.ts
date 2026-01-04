import { filterMap, SKIP } from './array';

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
