import { defineShortcutType } from '../../core/defineShortcutType';
import { extractWidgetProps } from '../../core/dxPropsHelper';
import { processAutoLabel } from '../../core/sharedSensibleDefaults.service';
import type {
  GslRangeCalendarConfig,
  RangeCalendarDecorator,
  RangeCalendarEntry,
} from './rangeCalendar.domain';

export const { gsl: _gslRangeCalendars, gslByUid: _gslRangeCalendarByUid } =
  defineShortcutType<RangeCalendarEntry, RangeCalendarDecorator, GslRangeCalendarConfig>({
    itemType: 'RANGE_CALENDAR',
    entryShape: 'keyed',
    sensibleDefaults: {
      base: { suppressAutomaticLabels: false },
      fields: ['suppressAutomaticLabels'],
      apply: (def, config) => processAutoLabel(def, config),
    },
    mapToWidget: (def) => ({
      uid: def.uid ?? '',
      kind: 'input',
      type: 'rangeCalendar',
      path: def.path ?? '',
      ...(def.label != null ? { label: def.label } : {}),
      ...(def.disabled != null ? { disabled: def.disabled } : {}),
      ...(def.readonly != null ? { readonly: def.readonly } : {}),
      props: extractWidgetProps(def),
    }),
  });
