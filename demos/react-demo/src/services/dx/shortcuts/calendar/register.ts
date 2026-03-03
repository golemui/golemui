import {
  InputWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import { GslLeafSelector } from '../../core/dx.domain';
import { registerItemType, ItemTypeHandler } from '../../core/itemTypeRegistry';
import {
  CalendarDecorator,
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
  def: Record<string, any>,
  config: Record<string, any>,
): Record<string, any> {
  const calendarDef = def as CalendarDecorator;
  const calendarConfig = config as CalendarSensibleDefaultsConfig;
  return calendarSensibleDefaultsService.processAutomaticLabels(calendarDef, calendarConfig);
}

function mapToWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
>(def: Record<string, any>): NonFunctionWidget<StateKeys, FormData> {
  const calendarDef = def as CalendarDecorator;
  return {
    uid: '',
    kind: 'input',
    type: 'calendar',
    path: calendarDef.path ?? '',
    ...(calendarDef.label != null ? { label: calendarDef.label } : {}),
    props: {
      ...(calendarDef.minDate != null ? { minDate: calendarDef.minDate } : {}),
      ...(calendarDef.maxDate != null ? { maxDate: calendarDef.maxDate } : {}),
    },
  } as InputWidget<any, StateKeys, FormData>;
}

function parseEntry(entry: any): { baseDef: any; path?: string } {
  // CalendarEntry is a bare decorator or callback — path lives inside the decorator
  return { baseDef: entry };
}

const handler: ItemTypeHandler = {
  rollUpSensibleDefaults,
  applySensibleDefaults,
  mapToWidget,
  parseEntry,
};

registerItemType('CALENDAR', handler);
