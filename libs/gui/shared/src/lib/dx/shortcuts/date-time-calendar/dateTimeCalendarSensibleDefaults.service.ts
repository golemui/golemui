import {
  type DateTimeCalendarDecorator,
  type DateTimeCalendarSensibleDefaultsConfig,
} from './dateTimeCalendar.domain';
import { processAutoLabel } from '../../core/sharedSensibleDefaults.service';

export class DateTimeCalendarSensibleDefaultsService {
  public processAutomaticLabels(
    item: DateTimeCalendarDecorator,
    currentConfig: DateTimeCalendarSensibleDefaultsConfig,
  ): DateTimeCalendarDecorator {
    return processAutoLabel(item, currentConfig);
  }
}

const dateTimeCalendarSensibleDefaultsService = new DateTimeCalendarSensibleDefaultsService();
export default dateTimeCalendarSensibleDefaultsService;
