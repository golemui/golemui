import { type CalendarDecorator, type CalendarSensibleDefaultsConfig } from './calendar.domain';
import { processAutoLabel } from '@golemui/dx';

export class CalendarSensibleDefaultsService {
  public processAutomaticLabels(
    item: CalendarDecorator,
    currentConfig: CalendarSensibleDefaultsConfig,
  ): CalendarDecorator {
    return processAutoLabel(item, currentConfig);
  }
}

const calendarSensibleDefaultsService = new CalendarSensibleDefaultsService();
export default calendarSensibleDefaultsService;
