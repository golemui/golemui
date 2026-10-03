import { describe, expect, it } from 'vitest';
import { showsErrors } from './templates';

describe('showsErrors', () => {
  it('shows errors as soon as they are set when touched is not tracked', () => {
    expect(showsErrors(undefined, ['Required'])).toBe(true);
  });

  it('holds errors back until the control is touched when touched is tracked', () => {
    expect(showsErrors(false, ['Required'])).toBe(false);
    expect(showsErrors(true, ['Required'])).toBe(true);
  });

  it('shows nothing without errors', () => {
    expect(showsErrors(undefined, [])).toBe(false);
    expect(showsErrors(true, undefined)).toBe(false);
  });
});
