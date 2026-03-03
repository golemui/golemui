import { CalendarDecorator, CalendarSensibleDefaultsConfig } from './calendar.domain';

export class CalendarSensibleDefaultsService {
  public processAutomaticLabels(
    item: CalendarDecorator,
    currentConfig: CalendarSensibleDefaultsConfig,
  ): CalendarDecorator {
    // If it already has a label, don't touch it
    if (item.label != null) {
      return item;
    }

    const shouldAddSensibleDefault = currentConfig.suppressAutomaticLabels !== true;

    if (!shouldAddSensibleDefault) {
      return item;
    }

    return {
      ...item,
      label: item.path,
    };
  }
}

const calendarSensibleDefaultsService = new CalendarSensibleDefaultsService();
export default calendarSensibleDefaultsService;
