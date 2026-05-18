import { type DxRuntimeParams } from '../../core/dxUtilityTypes';
import type { CheckboxDecorator, CheckboxEntry, GuiCheckboxShortcut } from './checkbox.domain';

export function _guiCheckbox(path: string): GuiCheckboxShortcut;
export function _guiCheckbox(
  path: string,
  props: Partial<Omit<CheckboxDecorator, 'type'>>,
): GuiCheckboxShortcut;
export function _guiCheckbox(
  path: string,
  props: Partial<Omit<CheckboxDecorator, 'type'>>,
  tags: string[],
): GuiCheckboxShortcut;
export function _guiCheckbox(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<CheckboxDecorator, 'type'>>,
  tags?: string[],
): GuiCheckboxShortcut;
export function _guiCheckbox(
  path: string,
  propsOrCallback?:
    | Partial<Omit<CheckboxDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<CheckboxDecorator, 'type'>>),
  tags?: string[],
): GuiCheckboxShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({ type: 'checkbox' as const, ...callback(params) });
    const items: CheckboxEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'CHECKBOX', items, tags: tags ?? [] };
  }

  const def: CheckboxDecorator = { type: 'checkbox', ...propsOrCallback };
  const items: CheckboxEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'CHECKBOX', items, tags: tags ?? [] };
}
