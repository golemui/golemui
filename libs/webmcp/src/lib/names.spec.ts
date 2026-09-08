import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertBaseName, assertToolName, claimBaseName } from './names';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('assertBaseName', () => {
  it('accepts WebMCP-safe names up to 100 characters', () => {
    expect(() => assertBaseName('signup')).not.toThrow();
    expect(() => assertBaseName('sign-up_v2.form')).not.toThrow();
    expect(() => assertBaseName('a'.repeat(100))).not.toThrow();
  });

  it('rejects anything else with a message that names the rule', () => {
    for (const bad of ['', 'sign up', 'sign/up', 'a'.repeat(101), undefined, 42]) {
      expect(() => assertBaseName(bad)).toThrow(/1 to 100 characters/);
    }
  });
});

describe('assertToolName', () => {
  it('allows the full 128 characters of a tool name', () => {
    expect(() => assertToolName('a'.repeat(128))).not.toThrow();
    expect(() => assertToolName('a'.repeat(129))).toThrow(TypeError);
    expect(() => assertToolName('with space')).toThrow(TypeError);
  });
});

describe('claimBaseName', () => {
  it('gives the requested name to the first claimant and a suffix to the next, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const first = claimBaseName('checkout');
    const second = claimBaseName('checkout');
    const third = claimBaseName('checkout');

    expect(first.name).toBe('checkout');
    expect(second.name).toBe('checkout-2');
    expect(third.name).toBe('checkout-3');
    expect(warn).toHaveBeenCalledTimes(2);

    first.release();
    second.release();
    third.release();
  });

  it('frees the name on release', () => {
    const first = claimBaseName('profile');
    first.release();
    const again = claimBaseName('profile');
    expect(again.name).toBe('profile');
    again.release();
  });
});
