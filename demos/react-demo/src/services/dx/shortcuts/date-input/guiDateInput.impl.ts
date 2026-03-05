import { DxRuntimeParams } from '../../core/dxUtilityTypes';
import type { DateInputDecorator, DateInputEntry, GuiDateInputShortcut } from './dateInput.domain';

export function _guiDateInput(path: string): GuiDateInputShortcut;
export function _guiDateInput(
  path: string,
  props: Partial<Omit<DateInputDecorator, 'type'>>,
): GuiDateInputShortcut;
export function _guiDateInput(
  path: string,
  props: Partial<Omit<DateInputDecorator, 'type'>>,
  tags: string[],
): GuiDateInputShortcut;
export function _guiDateInput(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<DateInputDecorator, 'type'>>,
  tags?: string[],
): GuiDateInputShortcut;
export function _guiDateInput(
  path: string,
  propsOrCallback?:
    | Partial<Omit<DateInputDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<DateInputDecorator, 'type'>>),
  tags?: string[],
): GuiDateInputShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({ type: 'dateInput' as const, ...callback(params) });
    const items: DateInputEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'DATE_INPUT', items, tags: tags ?? [] };
  }

  const def: DateInputDecorator = { type: 'dateInput', ...propsOrCallback };
  const items: DateInputEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'DATE_INPUT', items, tags: tags ?? [] };
}
