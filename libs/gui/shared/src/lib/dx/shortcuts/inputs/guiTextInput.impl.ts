import { GuiItemTypes } from '../../core/dx.domain';
import { DxRuntimeParams } from '../../core/dxUtilityTypes';
import {
  GuiInputsShortcut,
  TextDataInputDecorator,
} from './inputs.domain';

export function _guiTextInput(path: string): GuiInputsShortcut;
export function _guiTextInput(
  path: string,
  props: Partial<Omit<TextDataInputDecorator, 'type'>>,
): GuiInputsShortcut;
export function _guiTextInput(
  path: string,
  props: Partial<Omit<TextDataInputDecorator, 'type'>>,
  tags: string[],
): GuiInputsShortcut;
export function _guiTextInput(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<TextDataInputDecorator, 'type'>>,
  tags?: string[],
): GuiInputsShortcut;
export function _guiTextInput(
  path: string,
  propsOrCallback?:
    | Partial<Omit<TextDataInputDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<TextDataInputDecorator, 'type'>>),
  tags?: string[],
): GuiInputsShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({ type: 'text' as const, ...callback(params) });
    return {
      items: [{ key: path, def }],
      type: 'ITEMS',
      itemType: GuiItemTypes.INPUTS,
      tags: tags ?? [],
    };
  }

  const def: TextDataInputDecorator = { type: 'text', ...propsOrCallback };
  return {
    items: [{ key: path, def }],
    type: 'ITEMS',
    itemType: GuiItemTypes.INPUTS,
    tags: tags ?? [],
  };
}
