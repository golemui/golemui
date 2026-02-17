import { ActionDecorator, ActionDefCallback } from '../../../formDef.domain';
import { GuiActionsShortcut, GuiItemsShortcutType, GuiShortcutType } from '../gui.domain';
import objectUtils from '../../../../../utils/objectUtils.service';

export const _guiButtons = (
  defs: (ActionDecorator | ActionDefCallback)[],
  tags?: string[],
): GuiActionsShortcut => {
  return {
    items: defs,
    type: GuiShortcutType.ITEMS,
    itemsType: GuiItemsShortcutType.ACTIONS,
    tags: tags ?? [],
  };
};

export const _guiButton = (
  defs: ActionDecorator | ActionDefCallback,
  tags?: string[],
): GuiActionsShortcut => {
  return _guiButtons([defs], tags);
};

export const _guiSubmitButton = (defs?: ActionDecorator | ActionDefCallback): GuiActionsShortcut => {
  const baseSubmit: ActionDecorator = {
    uid: '#submit',
    label: 'Submit',
  };
  const merged = defs != null ? objectUtils.deepMerge(baseSubmit, defs) : baseSubmit;
  return _guiButton(merged);
};
