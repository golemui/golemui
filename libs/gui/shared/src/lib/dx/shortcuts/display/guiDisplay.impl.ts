import { GuiItemTypes } from '../../core/dx.domain';
import { DxRuntimeParams } from '../../core/dxUtilityTypes';
import { GuiDisplayItemsShortcut } from './display.domain';

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
