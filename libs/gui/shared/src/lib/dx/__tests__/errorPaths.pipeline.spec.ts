import { describe, expect, it } from 'vitest';
import { formDefs } from '../formDefs';
import { type ValidGuiShortcut, GuiItemTypes } from '@golemui/dx';
import { guiRegistry } from '../registry';

describe('DX Pipeline — Error Paths', () => {
  it('throws when an unregistered item type is encountered', () => {
    const bogusShortcut: ValidGuiShortcut = {
      type: 'ITEMS',
      itemType: 'NONEXISTENT_WIDGET' as any,
      items: [{ key: 'x', def: {} }],
      tags: [],
    };

    expect(() => formDefs.processDxFacade(bogusShortcut)).toThrow(
      'No handler registered for item type "NONEXISTENT_WIDGET"',
    );
  });

  it('throws when the same item type is registered twice', () => {
    expect(guiRegistry.hasItemTypeHandler(GuiItemTypes.INPUTS)).toBe(true);

    expect(() => guiRegistry.registerItemType(GuiItemTypes.INPUTS, {} as any)).toThrow(
      `Item type "${GuiItemTypes.INPUTS}" is already registered`,
    );
  });
});
