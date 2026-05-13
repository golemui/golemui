import { GuiItemTypes } from '../../core/dx.domain';
import { DxRuntimeParams } from '../../core/dxUtilityTypes';
import { GuiInputsShortcut, NumberDataInputDecorator } from './inputs.domain';

export function _guiNumberInput(path: string): GuiInputsShortcut;
export function _guiNumberInput(
  path: string,
  props: Partial<Omit<NumberDataInputDecorator, 'type'>>,
): GuiInputsShortcut;
export function _guiNumberInput(
  path: string,
  props: Partial<Omit<NumberDataInputDecorator, 'type'>>,
  tags: string[],
): GuiInputsShortcut;
export function _guiNumberInput(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<NumberDataInputDecorator, 'type'>>,
  tags?: string[],
): GuiInputsShortcut;
export function _guiNumberInput(
  path: string,
  propsOrCallback?:
    | Partial<Omit<NumberDataInputDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<NumberDataInputDecorator, 'type'>>),
  tags?: string[],
): GuiInputsShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({ type: 'number' as const, ...callback(params) });
    return {
      items: [{ key: path, def }],
      type: 'ITEMS',
      itemType: GuiItemTypes.INPUTS,
      tags: tags ?? [],
    };
  }

  const def: NumberDataInputDecorator = { type: 'number', ...propsOrCallback };
  return {
    items: [{ key: path, def }],
    type: 'ITEMS',
    itemType: GuiItemTypes.INPUTS,
    tags: tags ?? [],
  };
}
