import { GuiItemTypes } from '../../core/dx.domain';
import { type DxRuntimeParams } from '../../core/dxUtilityTypes';
import { type GuiDisplayItemsShortcut } from './display.domain';

export const _guiDisplay = (
  render: (params: DxRuntimeParams) => any,
  tags?: string[],
): GuiDisplayItemsShortcut => {
  return {
    type: 'ITEMS',
    itemType: GuiItemTypes.DISPLAYS,
    items: [{ render }],
    tags: tags ?? [],
  };
};
