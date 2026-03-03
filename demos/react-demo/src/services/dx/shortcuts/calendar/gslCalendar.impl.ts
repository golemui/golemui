import { GslLeafSelector } from '../../core/dx.domain';
import { CalendarDecorator, GslCalendarConfig } from './calendar.domain';

export function _gslCalendar(
  config: GslCalendarConfig,
  matcher: (decorator: CalendarDecorator) => boolean = () => true,
): GslLeafSelector {
  return {
    kind: 'leaf',
    selectorType: 'CALENDAR',
    matcher,
    config,
  };
}
