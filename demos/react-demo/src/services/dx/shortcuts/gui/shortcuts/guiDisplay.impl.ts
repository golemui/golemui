import { DxRuntimeParams } from '../../../formDef.domain';
import { GuiDisplayShortcut, GuiShortcutType } from '../gui.domain';

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
