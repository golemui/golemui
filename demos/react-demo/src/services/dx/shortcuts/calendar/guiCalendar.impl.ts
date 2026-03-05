import {
  GuiCalendarShortcut,
  CalendarDecorator,
  CalendarEntry,
} from './calendar.domain';

export const _guiCalendar = (
  pathOrDef: string | CalendarEntry,
  tags?: string[],
): GuiCalendarShortcut => {
  const def: CalendarEntry =
    typeof pathOrDef === 'string'
      ? { type: 'calendar', path: pathOrDef } as CalendarDecorator
      : pathOrDef;
  return {
    items: [def],
    type: 'ITEMS',
    itemType: 'CALENDAR',
    tags: tags ?? [],
  };
};
