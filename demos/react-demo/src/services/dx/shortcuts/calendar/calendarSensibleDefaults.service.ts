import { CalendarDecorator, CalendarSensibleDefaultsConfig } from './calendar.domain';
import { processAutoLabel } from '../../core/sharedSensibleDefaults.service';

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
