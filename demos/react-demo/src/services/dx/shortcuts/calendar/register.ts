import {
  InputWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import { GslLeafSelector } from '../../core/dx.domain';
import { registerItemType, ItemTypeHandler, ParsedEntry } from '../../core/itemTypeRegistry';
import {
  CalendarDecorator,
  CalendarEntry,
  CalendarSensibleDefaultsConfig,
  GslCalendarConfig,
} from './calendar.domain';
import calendarSensibleDefaultsService from './calendarSensibleDefaults.service';

const BASE_CALENDAR_SENSIBLE_DEFAULTS: CalendarSensibleDefaultsConfig = {
  suppressAutomaticLabels: false,
};

function rollUpSensibleDefaults(leafSelectors: GslLeafSelector[]): CalendarSensibleDefaultsConfig {
  let result: CalendarSensibleDefaultsConfig = { ...BASE_CALENDAR_SENSIBLE_DEFAULTS };

  for (const leaf of leafSelectors) {
    const cfg = leaf.config as GslCalendarConfig;
    if (cfg.suppressAutomaticLabels != null) {
      result = { ...result, suppressAutomaticLabels: cfg.suppressAutomaticLabels };
    }
  }

  return result;
}

function applySensibleDefaults(
  def: CalendarDecorator,
  config: CalendarSensibleDefaultsConfig,
): CalendarDecorator {
  return calendarSensibleDefaultsService.processAutomaticLabels(def, config);
}

function mapToWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
>(def: CalendarDecorator): NonFunctionWidget<StateKeys, FormData> {
  return {
    uid: '',
    kind: 'input',
    type: 'calendar',
    path: def.path ?? '',
    ...(def.label != null ? { label: def.label } : {}),
    props: {
      ...(def.minDate != null ? { minDate: def.minDate } : {}),
      ...(def.maxDate != null ? { maxDate: def.maxDate } : {}),
    },
  } as InputWidget<any, StateKeys, FormData>;
}

function parseEntry(entry: CalendarEntry): ParsedEntry<CalendarDecorator> {
  // CalendarEntry is a bare decorator or callback — path lives inside the decorator
  return { baseDef: entry };
}

const handler: ItemTypeHandler<CalendarEntry, CalendarDecorator, CalendarSensibleDefaultsConfig> = {
  rollUpSensibleDefaults,
  applySensibleDefaults,
  mapToWidget,
  parseEntry,
};

registerItemType('CALENDAR', handler);
