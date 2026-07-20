import { type DxRuntimeParams } from '../../core/dxUtilityTypes';
import type {
  GuiRangeDateTimeCalendarShortcut,
  RangeDateTimeCalendarDecorator,
  RangeDateTimeCalendarEntry,
} from './rangeDateTimeCalendar.domain';

export function _guiRangeDateTimeCalendar(path: string): GuiRangeDateTimeCalendarShortcut;
export function _guiRangeDateTimeCalendar(
  path: string,
  props: Partial<Omit<RangeDateTimeCalendarDecorator, 'type'>>,
): GuiRangeDateTimeCalendarShortcut;
export function _guiRangeDateTimeCalendar(
  path: string,
  props: Partial<Omit<RangeDateTimeCalendarDecorator, 'type'>>,
  tags: string[],
): GuiRangeDateTimeCalendarShortcut;
export function _guiRangeDateTimeCalendar(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<RangeDateTimeCalendarDecorator, 'type'>>,
  tags?: string[],
): GuiRangeDateTimeCalendarShortcut;
export function _guiRangeDateTimeCalendar(
  path: string,
  propsOrCallback?:
    | Partial<Omit<RangeDateTimeCalendarDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<RangeDateTimeCalendarDecorator, 'type'>>),
  tags?: string[],
): GuiRangeDateTimeCalendarShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'rangeDateTimeCalendar' as const,
      ...callback(params),
    });
    const items: RangeDateTimeCalendarEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'RANGE_DATE_TIME_CALENDAR', items, tags: tags ?? [] };
  }

  const def: RangeDateTimeCalendarDecorator = { type: 'rangeDateTimeCalendar', ...propsOrCallback };
  const items: RangeDateTimeCalendarEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'RANGE_DATE_TIME_CALENDAR', items, tags: tags ?? [] };
}
