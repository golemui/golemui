import { type DxRuntimeParams } from '@golemui/dx';
import type {
  GuiRangeDateTimeInputShortcut,
  RangeDateTimeInputDecorator,
  RangeDateTimeInputEntry,
} from './rangeDateTimeInput.domain';

export function _guiRangeDateTimeInput(path: string): GuiRangeDateTimeInputShortcut;
export function _guiRangeDateTimeInput(
  path: string,
  props: Partial<Omit<RangeDateTimeInputDecorator, 'type'>>,
): GuiRangeDateTimeInputShortcut;
export function _guiRangeDateTimeInput(
  path: string,
  props: Partial<Omit<RangeDateTimeInputDecorator, 'type'>>,
  tags: string[],
): GuiRangeDateTimeInputShortcut;
export function _guiRangeDateTimeInput(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<RangeDateTimeInputDecorator, 'type'>>,
  tags?: string[],
): GuiRangeDateTimeInputShortcut;
export function _guiRangeDateTimeInput(
  path: string,
  propsOrCallback?:
    | Partial<Omit<RangeDateTimeInputDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<RangeDateTimeInputDecorator, 'type'>>),
  tags?: string[],
): GuiRangeDateTimeInputShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'rangeDateTimeInput' as const,
      ...callback(params),
    });
    const items: RangeDateTimeInputEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'RANGE_DATE_TIME_INPUT', items, tags: tags ?? [] };
  }

  const def: RangeDateTimeInputDecorator = { type: 'rangeDateTimeInput', ...propsOrCallback };
  const items: RangeDateTimeInputEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'RANGE_DATE_TIME_INPUT', items, tags: tags ?? [] };
}
