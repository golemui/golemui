import { GuiItemTypes } from '@golemui/dx';
import { type DxRuntimeParams } from '@golemui/dx';
import { type ActionDecorator, type GuiActionsShortcut } from './actions.domain';

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
