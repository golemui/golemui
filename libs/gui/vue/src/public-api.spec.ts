import { describe, expect, it } from 'vitest';

describe('public exports', () => {
  // On CI widget.loaders.spec.ts runs in parallel and this import waits for its Vite transforms, which can take more than 5 s.
  it('exports these names from the main entry', { timeout: 30_000 }, async () => {
    const entry = await import('./index');

    expect(Object.keys(entry).sort()).toMatchInlineSnapshot(`
      [
        "DefaultListItemRenderer",
        "GuiForm",
        "widgetLoaders",
      ]
    `);
  });
});
