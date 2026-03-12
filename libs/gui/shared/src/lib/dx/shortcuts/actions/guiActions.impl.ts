import { GuiItemTypes } from '../../core/dx.domain';
import { DxRuntimeParams } from '../../core/dxUtilityTypes';
import { ActionDecorator, ActionDefOrCallback, ActionEntry, GuiActionsShortcut } from './actions.domain';
import { objectUtils } from '../../../utils/objectUtils.service';

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

export function _guiButton(props: ActionDecorator): GuiActionsShortcut;
export function _guiButton(props: ActionDecorator, tags: string[]): GuiActionsShortcut;
export function _guiButton(callback: (params: DxRuntimeParams) => Partial<ActionDecorator>): GuiActionsShortcut;
export function _guiButton(callback: (params: DxRuntimeParams) => Partial<ActionDecorator>, tags: string[]): GuiActionsShortcut;
export function _guiButton(
  propsOrCallback: ActionDecorator | ((params: DxRuntimeParams) => Partial<ActionDecorator>),
  tags?: string[],
): GuiActionsShortcut {
  return _guiButtons([propsOrCallback], tags);
}

export const _guiSubmitButton = (defs?: ActionDecorator | ActionDefOrCallback): GuiActionsShortcut => {
  const baseSubmit: ActionDecorator = {
    uid: '#submit',
    label: 'Submit',
  };
  const merged = defs != null ? objectUtils.deepMerge(baseSubmit, defs) : baseSubmit;
  return _guiButton(merged);
};
