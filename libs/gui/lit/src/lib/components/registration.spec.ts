// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

// The awaited imports cold-transform the underlying component graph, which can
// take several seconds on a loaded CI runner — hence the raised timeouts.
describe('gui-lit wrapper registration is idempotent', () => {
  it(
    'does not throw when the wrapper tag is already defined, and keeps the first definition',
    { timeout: 30_000 },
    async () => {
      class Stub extends HTMLElement {}
      customElements.define('gui-button-interactive', Stub);

      await expect(import('./button.element')).resolves.toBeDefined();
      expect(customElements.get('gui-button-interactive')).toBe(Stub);
    },
  );

  it(
    'does not throw when the underlying gui-components tag is already defined',
    { timeout: 30_000 },
    async () => {
      class Stub extends HTMLElement {}
      customElements.define('gui-textinput', Stub);

      await expect(import('./textinput.element')).resolves.toBeDefined();
      expect(customElements.get('gui-textinput')).toBe(Stub);
    },
  );
});
