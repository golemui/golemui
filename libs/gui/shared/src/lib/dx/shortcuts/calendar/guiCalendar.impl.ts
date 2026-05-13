import { DxRuntimeParams } from '../../core/dxUtilityTypes';
import { GuiCalendarShortcut, CalendarDecorator } from './calendar.domain';

export function _guiCalendar(path: string): GuiCalendarShortcut;
export function _guiCalendar(
  path: string,
  props: Partial<Omit<CalendarDecorator, 'type'>>,
): GuiCalendarShortcut;
export function _guiCalendar(
  path: string,
  props: Partial<Omit<CalendarDecorator, 'type'>>,
  tags: string[],
): GuiCalendarShortcut;
export function _guiCalendar(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<CalendarDecorator, 'type'>>,
  tags?: string[],
): GuiCalendarShortcut;
export function _guiCalendar(
  path: string,
  propsOrCallback?:
    | Partial<Omit<CalendarDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<CalendarDecorator, 'type'>>),
  tags?: string[],
): GuiCalendarShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'calendar' as const,
      path,
      ...callback(params),
    });
    return {
      items: [def],
      type: 'ITEMS',
      itemType: 'CALENDAR',
      tags: tags ?? [],
    };
  }

  const def: CalendarDecorator = { type: 'calendar', path, ...propsOrCallback };
  return {
    items: [def],
    type: 'ITEMS',
    itemType: 'CALENDAR',
    tags: tags ?? [],
  };
}
