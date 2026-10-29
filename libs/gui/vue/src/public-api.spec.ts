import { describe, expect, it } from 'vitest';
// A static import loads the entry before the test starts, so the slow cold load does not count against the test timeout.
import * as entry from './index';

describe('public exports', () => {
  it('exports these names from the main entry', () => {
    expect(Object.keys(entry).sort()).toMatchInlineSnapshot(`
      [
        "DefaultListItemRenderer",
        "GuiForm",
        "widgetLoaders",
      ]
    `);
  });
});
