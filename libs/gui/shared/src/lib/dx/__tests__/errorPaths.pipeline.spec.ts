import { describe, expect, it } from 'vitest';
import { formDefs } from '../dx.service';
import { type ValidGuiShortcut, GuiItemTypes } from '../core/dx.domain';
import { registerItemType, hasItemTypeHandler } from '../core/itemTypeRegistry';

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
    expect(hasItemTypeHandler(GuiItemTypes.INPUTS)).toBe(true);

    expect(() => registerItemType(GuiItemTypes.INPUTS, {} as any)).toThrow(
      `Item type "${GuiItemTypes.INPUTS}" is already registered`,
    );
  });
});
