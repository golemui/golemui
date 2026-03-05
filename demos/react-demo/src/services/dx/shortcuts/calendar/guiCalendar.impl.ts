import {
  GuiCalendarShortcut,
  CalendarDecorator,
} from './calendar.domain';

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
  props?: Partial<Omit<CalendarDecorator, 'type'>>,
  tags?: string[],
): GuiCalendarShortcut {
  const def: CalendarDecorator = { type: 'calendar', path, ...props };
  return {
    items: [def],
    type: 'ITEMS',
    itemType: 'CALENDAR',
    tags: tags ?? [],
  };
}
