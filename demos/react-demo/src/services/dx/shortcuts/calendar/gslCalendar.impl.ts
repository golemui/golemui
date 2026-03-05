import { createGslSelector } from '../../core/dxUtilityTypes';
import type { CalendarDecorator, GslCalendarConfig } from './calendar.domain';

export const _gslCalendar = createGslSelector<CalendarDecorator, GslCalendarConfig>('CALENDAR');
