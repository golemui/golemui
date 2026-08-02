import { GuiItemTypes } from '@golemui/dx';
import { type DxRuntimeParams } from '@golemui/dx';
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
