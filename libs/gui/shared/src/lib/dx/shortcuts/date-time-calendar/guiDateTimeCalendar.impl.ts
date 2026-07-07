import { type DxRuntimeParams } from '../../core/dxUtilityTypes';
import {
  type GuiDateTimeCalendarShortcut,
  type DateTimeCalendarDecorator,
} from './dateTimeCalendar.domain';

export function _guiDateTimeCalendar(path: string): GuiDateTimeCalendarShortcut;
export function _guiDateTimeCalendar(
  path: string,
  props: Partial<Omit<DateTimeCalendarDecorator, 'type'>>,
): GuiDateTimeCalendarShortcut;
export function _guiDateTimeCalendar(
  path: string,
  props: Partial<Omit<DateTimeCalendarDecorator, 'type'>>,
  tags: string[],
): GuiDateTimeCalendarShortcut;
export function _guiDateTimeCalendar(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<DateTimeCalendarDecorator, 'type'>>,
  tags?: string[],
): GuiDateTimeCalendarShortcut;
export function _guiDateTimeCalendar(
  path: string,
  propsOrCallback?:
    | Partial<Omit<DateTimeCalendarDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<DateTimeCalendarDecorator, 'type'>>),
  tags?: string[],
): GuiDateTimeCalendarShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'dateTimeCalendar' as const,
      path,
      ...callback(params),
    });
    return {
      items: [def],
      type: 'ITEMS',
      itemType: 'DATE_TIME_CALENDAR',
      tags: tags ?? [],
    };
  }

  const def: DateTimeCalendarDecorator = { type: 'dateTimeCalendar', path, ...propsOrCallback };
  return {
    items: [def],
    type: 'ITEMS',
    itemType: 'DATE_TIME_CALENDAR',
    tags: tags ?? [],
  };
}
