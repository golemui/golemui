import { describe, expect, it } from 'vitest';
import { stepValue } from './numeric';

describe('stepValue', () => {
  it('steps up and down by the step', () => {
    expect(stepValue(1, 1, { step: 0.5 })).toBe(1.5);
    expect(stepValue(1, -1, { step: 0.5 })).toBe(0.5);
  });

  it('rounds to the decimals of the value and the step', () => {
    expect(stepValue(0.2, 1, { step: 0.1 })).toBe(0.3);
    expect(stepValue(0.15, 1, { step: 0.1 })).toBe(0.25);
    expect(stepValue(1, 1, { step: 1e-7 })).toBe(1.0000001);
  });

  it('steps from 0 when the field is empty', () => {
    expect(stepValue(undefined, -1, { step: 5 })).toBe(-5);
    expect(stepValue(undefined, 1, {})).toBe(1);
  });

  it('counts a step that is not a positive number as 1', () => {
    expect(stepValue(5, 1, { step: 0 })).toBe(6);
    expect(stepValue(5, 1, { step: -2 })).toBe(6);
    expect(stepValue(5, 1, { step: Number.NaN })).toBe(6);
  });

  it('clamps to the bounds', () => {
    expect(stepValue(3, 1, { maximum: 3 })).toBe(3);
    expect(stepValue(undefined, -1, { minimum: 18 })).toBe(18);
  });
});
