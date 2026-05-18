import { type DxRuntimeParams } from '../../core/dxUtilityTypes';
import type {
  GuiRangeCalendarShortcut,
  RangeCalendarDecorator,
  RangeCalendarEntry,
} from './rangeCalendar.domain';

export function _guiRangeCalendar(path: string): GuiRangeCalendarShortcut;
export function _guiRangeCalendar(
  path: string,
  props: Partial<Omit<RangeCalendarDecorator, 'type'>>,
): GuiRangeCalendarShortcut;
export function _guiRangeCalendar(
  path: string,
  props: Partial<Omit<RangeCalendarDecorator, 'type'>>,
  tags: string[],
): GuiRangeCalendarShortcut;
export function _guiRangeCalendar(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<RangeCalendarDecorator, 'type'>>,
  tags?: string[],
): GuiRangeCalendarShortcut;
export function _guiRangeCalendar(
  path: string,
  propsOrCallback?:
    | Partial<Omit<RangeCalendarDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<RangeCalendarDecorator, 'type'>>),
  tags?: string[],
): GuiRangeCalendarShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'rangeCalendar' as const,
      ...callback(params),
    });
    const items: RangeCalendarEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'RANGE_CALENDAR', items, tags: tags ?? [] };
  }

  const def: RangeCalendarDecorator = { type: 'rangeCalendar', ...propsOrCallback };
  const items: RangeCalendarEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'RANGE_CALENDAR', items, tags: tags ?? [] };
}
