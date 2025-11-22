import { describe, expect, it } from 'vitest';
import { compose, pipe } from './function';

describe('pipe', () => {
  it('should return the value when no functions provided', () => {
    expect(pipe(5)).toBe(5);
  });

  it('should apply single function', () => {
    const addOne = (x: number) => x + 1;
    expect(pipe(5, addOne)).toBe(6);
  });

  it('should apply multiple functions left to right', () => {
    const addOne = (x: number) => x + 1;
    const double = (x: number) => x * 2;
    const toString = (x: number) => `Result: ${x}`;

    expect(pipe(5, addOne, double, toString)).toBe('Result: 12');
  });

  it('should handle type transformations', () => {
    const toLength = (s: string) => s.length;
    const isEven = (n: number) => n % 2 === 0;

    expect(pipe('hello', toLength, isEven)).toBe(false);
    expect(pipe('test', toLength, isEven)).toBe(true);
  });

  it('should work with complex pipelines', () => {
    const trim = (s: string) => s.trim();
    const toLowerCase = (s: string) => s.toLowerCase();
    const split = (s: string) => s.split(' ');
    const getLength = (arr: string[]) => arr.length;

    expect(pipe('  Hello World  ', trim, toLowerCase, split, getLength)).toBe(2);
  });
});

describe('compose', () => {
  it('should return identity function with single function', () => {
    const addOne = (x: number) => x + 1;
    const composed = compose(addOne);
    expect(composed(5)).toBe(6);
  });

  it('should apply functions right to left', () => {
    const addOne = (x: number) => x + 1;
    const double = (x: number) => x * 2;

    const composed = compose(double, addOne);
    expect(composed(5)).toBe(12); // (5 + 1) * 2
  });

  it('should handle multiple function compositions', () => {
    const addOne = (x: number) => x + 1;
    const double = (x: number) => x * 2;
    const toString = (x: number) => `Result: ${x}`;

    const composed = compose(toString, double, addOne);
    expect(composed(5)).toBe('Result: 12');
  });

  it('should handle type transformations', () => {
    const getLength = (s: string) => s.length;
    const isEven = (n: number) => n % 2 === 0;

    const checkEvenLength = compose(isEven, getLength);
    expect(checkEvenLength('hello')).toBe(false);
    expect(checkEvenLength('test')).toBe(true);
  });

  it('should produce same result as pipe but with reversed order', () => {
    const addOne = (x: number) => x + 1;
    const double = (x: number) => x * 2;
    const square = (x: number) => x * x;

    const pipeResult = pipe(3, addOne, double, square);
    const composeResult = compose(square, double, addOne)(3);

    expect(pipeResult).toBe(composeResult);
    expect(pipeResult).toBe(64);
  });
});
