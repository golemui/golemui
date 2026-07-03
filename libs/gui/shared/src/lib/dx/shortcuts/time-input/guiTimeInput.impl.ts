import { type DxRuntimeParams } from '../../core/dxUtilityTypes';
import type { TimeInputDecorator, TimeInputEntry, GuiTimeInputShortcut } from './timeInput.domain';

export function _guiTimeInput(path: string): GuiTimeInputShortcut;
export function _guiTimeInput(
  path: string,
  props: Partial<Omit<TimeInputDecorator, 'type'>>,
): GuiTimeInputShortcut;
export function _guiTimeInput(
  path: string,
  props: Partial<Omit<TimeInputDecorator, 'type'>>,
  tags: string[],
): GuiTimeInputShortcut;
export function _guiTimeInput(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<TimeInputDecorator, 'type'>>,
  tags?: string[],
): GuiTimeInputShortcut;
export function _guiTimeInput(
  path: string,
  propsOrCallback?:
    | Partial<Omit<TimeInputDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<TimeInputDecorator, 'type'>>),
  tags?: string[],
): GuiTimeInputShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({ type: 'timeInput' as const, ...callback(params) });
    const items: TimeInputEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'TIME_INPUT', items, tags: tags ?? [] };
  }

  const def: TimeInputDecorator = { type: 'timeInput', ...propsOrCallback };
  const items: TimeInputEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'TIME_INPUT', items, tags: tags ?? [] };
}
