import { GuiItemTypes } from '@golemui/dx';
import { type DxRuntimeParams } from '@golemui/dx';
import { type BooleanDataInputDecorator, type GuiInputsShortcut } from './inputs.domain';

export function _guiBooleanInput(path: string): GuiInputsShortcut;
export function _guiBooleanInput(
  path: string,
  props: Partial<Omit<BooleanDataInputDecorator, 'type'>>,
): GuiInputsShortcut;
export function _guiBooleanInput(
  path: string,
  props: Partial<Omit<BooleanDataInputDecorator, 'type'>>,
  tags: string[],
): GuiInputsShortcut;
export function _guiBooleanInput(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<BooleanDataInputDecorator, 'type'>>,
  tags?: string[],
): GuiInputsShortcut;
export function _guiBooleanInput(
  path: string,
  propsOrCallback?:
    | Partial<Omit<BooleanDataInputDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<BooleanDataInputDecorator, 'type'>>),
  tags?: string[],
): GuiInputsShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({ type: 'boolean' as const, ...callback(params) });
    return {
      items: [{ key: path, def }],
      type: 'ITEMS',
      itemType: GuiItemTypes.INPUTS,
      tags: tags ?? [],
    };
  }

  const def: BooleanDataInputDecorator = { type: 'boolean', ...propsOrCallback };
  return {
    items: [{ key: path, def }],
    type: 'ITEMS',
    itemType: GuiItemTypes.INPUTS,
    tags: tags ?? [],
  };
}
