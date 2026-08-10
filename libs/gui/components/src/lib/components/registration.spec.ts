// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

// Reproduces the NotSupportedError from v1.2.0: importing gui-components after
// another copy of an element (e.g. from @golemui/gui-lit's lazy chunks) has
// already claimed the tag must not throw, and the first definition must win.
describe('gui-components registration is idempotent', () => {
  it('does not throw when a gui-* tag is already defined, and keeps the first definition', async () => {
    class Stub extends HTMLElement {}
    customElements.define('gui-button', Stub);

    await expect(import('./button')).resolves.toBeDefined();
    expect(customElements.get('gui-button')).toBe(Stub);

    await expect(import('../../index')).resolves.toBeDefined();
    expect(customElements.get('gui-button')).toBe(Stub);
  });

  it('importing the barrel twice does not throw', async () => {
    await import('../../index');
    await expect(import('../../index')).resolves.toBeDefined();
  });
});
