import { type DxRuntimeParams } from '@golemui/dx';
import type {
  DateTimeInputDecorator,
  DateTimeInputEntry,
  GuiDateTimeInputShortcut,
} from './dateTimeInput.domain';

export function _guiDateTimeInput(path: string): GuiDateTimeInputShortcut;
export function _guiDateTimeInput(
  path: string,
  props: Partial<Omit<DateTimeInputDecorator, 'type'>>,
): GuiDateTimeInputShortcut;
export function _guiDateTimeInput(
  path: string,
  props: Partial<Omit<DateTimeInputDecorator, 'type'>>,
  tags: string[],
): GuiDateTimeInputShortcut;
export function _guiDateTimeInput(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<DateTimeInputDecorator, 'type'>>,
  tags?: string[],
): GuiDateTimeInputShortcut;
export function _guiDateTimeInput(
  path: string,
  propsOrCallback?:
    | Partial<Omit<DateTimeInputDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<DateTimeInputDecorator, 'type'>>),
  tags?: string[],
): GuiDateTimeInputShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'dateTimeInput' as const,
      ...callback(params),
    });
    const items: DateTimeInputEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'DATE_TIME_INPUT', items, tags: tags ?? [] };
  }

  const def: DateTimeInputDecorator = { type: 'dateTimeInput', ...propsOrCallback };
  const items: DateTimeInputEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'DATE_TIME_INPUT', items, tags: tags ?? [] };
}
