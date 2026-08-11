// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

describe('gui-lit wrapper registration is idempotent', () => {
  it('does not throw when the wrapper tag is already defined, and keeps the first definition', async () => {
    class Stub extends HTMLElement {}
    customElements.define('gui-button-interactive', Stub);

    await expect(import('./button.element')).resolves.toBeDefined();
    expect(customElements.get('gui-button-interactive')).toBe(Stub);
  });

  it('does not throw when the underlying gui-components tag is already defined', async () => {
    class Stub extends HTMLElement {}
    customElements.define('gui-textinput', Stub);

    await expect(import('./textinput.element')).resolves.toBeDefined();
    expect(customElements.get('gui-textinput')).toBe(Stub);
  });
});
