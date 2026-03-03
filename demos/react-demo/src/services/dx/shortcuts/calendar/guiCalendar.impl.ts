import {
  GuiCalendarShortcut,
  CalendarDecorator,
  CalendarDefOrCallback,
} from './calendar.domain';

export const _guiCalendar = (
  pathOrDef: string | CalendarDefOrCallback,
  tags?: string[],
): GuiCalendarShortcut => {
  const def: CalendarDefOrCallback =
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
