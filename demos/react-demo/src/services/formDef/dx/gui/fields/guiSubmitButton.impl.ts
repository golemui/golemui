import { ActionDef, ControllerDefCallback } from '../../../formDef.domain';
import { GuiControllersShortcut, GuiShortcutType } from '../gui.domain';
import objectUtils from '../../../../../utils/objectUtils.service';

export const _guiButtons = (
  defs: (ActionDef | ControllerDefCallback)[],
  tags?: string[],
): GuiControllersShortcut => {
  return {
    controllers: defs,
    type: GuiShortcutType.CONTROLLERS,
    tags: tags ?? [],
  };
};

export const _guiButton = (
  defs: ActionDef | ControllerDefCallback,
  tags?: string[],
): GuiControllersShortcut => {
  return _guiButtons([defs], tags);
};

export const _guiSubmitButton = (
  defs?: ActionDef | ControllerDefCallback,
): GuiControllersShortcut => {
  const baseSubmit = {
    label: 'Submit',
    on: {
      click: 'submit',
    },
  };
  const merged = defs == null? objectUtils.deepMerge(baseSubmit, defs) : baseSubmit;
  return _guiButton(
    merged,
  );
};

