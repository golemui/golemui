// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { safeDefine } from './define';

describe('safeDefine', () => {
  it('defines the element when the tag is free', () => {
    class A extends HTMLElement {}
    safeDefine('x-safe-define-fresh', A);
    expect(customElements.get('x-safe-define-fresh')).toBe(A);
  });

  it('does not throw on collision and keeps the first definition', () => {
    class A extends HTMLElement {}
    class B extends HTMLElement {}
    safeDefine('x-safe-define-collision', A);
    expect(() => safeDefine('x-safe-define-collision', B)).not.toThrow();
    expect(customElements.get('x-safe-define-collision')).toBe(A);
  });
});
