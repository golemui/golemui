import { GuiItemTypes } from '../../core/dx.domain';
import { type DxRuntimeParams } from '../../core/dxUtilityTypes';
import {
  type ActionDecorator,
  type ActionDefOrCallback,
  type GuiActionsShortcut,
} from './actions.domain';
import { objectUtils } from '../../../utils/objectUtils.service';

export function _guiButton(props: ActionDecorator): GuiActionsShortcut;
export function _guiButton(props: ActionDecorator, tags: string[]): GuiActionsShortcut;
export function _guiButton(
  callback: (params: DxRuntimeParams) => Partial<ActionDecorator>,
): GuiActionsShortcut;
export function _guiButton(
  callback: (params: DxRuntimeParams) => Partial<ActionDecorator>,
  tags: string[],
): GuiActionsShortcut;
export function _guiButton(
  propsOrCallback: ActionDecorator | ((params: DxRuntimeParams) => Partial<ActionDecorator>),
  tags?: string[],
): GuiActionsShortcut {
  return {
    items: [propsOrCallback],
    type: 'ITEMS',
    itemType: GuiItemTypes.ACTIONS,
    tags: tags ?? [],
  };
}

export const _guiSubmitButton = (
  defs?: ActionDecorator | ActionDefOrCallback,
): GuiActionsShortcut => {
  const baseSubmit: ActionDecorator = {
    uid: '#submit',
    label: 'Submit',
  };
  const merged = defs != null ? objectUtils.deepMerge(baseSubmit, defs) : baseSubmit;
  return _guiButton(merged);
};
