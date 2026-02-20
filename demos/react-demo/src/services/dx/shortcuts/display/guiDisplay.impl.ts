import { GuiShortcutType } from '../../core/dx.domain';
import { GuiDisplayShortcut } from './display.domain';
import { DxRuntimeParams } from '../inputs/inputs.domain';

export const _guiDisplay = (
  render: (params: DxRuntimeParams) => any,
  tags?: string[],
): GuiDisplayShortcut => {
  return {
    type: GuiShortcutType.DISPLAY,
    render,
    tags: tags ?? [],
  };
};
