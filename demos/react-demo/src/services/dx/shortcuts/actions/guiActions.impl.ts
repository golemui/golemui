import { GuiItemTypes } from '../../core/dx.domain';
import { ActionDecorator, ActionDefOrCallback, ActionEntry, GuiActionsShortcut } from './actions.domain';
import objectUtils from '../../../../utils/objectUtils.service';

export const _guiButtons = (
  defs: ActionEntry[],
  tags?: string[],
): GuiActionsShortcut => {
  return {
    items: defs,
    type: 'ITEMS',
    itemType: GuiItemTypes.ACTIONS,
    tags: tags ?? [],
  };
};

export const _guiButton = (
  defs: ActionDecorator | ActionDefOrCallback,
  tags?: string[],
): GuiActionsShortcut => {
  return _guiButtons([defs], tags);
};

export const _guiSubmitButton = (defs?: ActionDecorator | ActionDefOrCallback): GuiActionsShortcut => {
  const baseSubmit: ActionDecorator = {
    uid: '#submit',
    label: 'Submit',
  };
  const merged = defs != null ? objectUtils.deepMerge(baseSubmit, defs) : baseSubmit;
  return _guiButton(merged);
};
