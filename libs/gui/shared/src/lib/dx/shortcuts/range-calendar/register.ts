import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type {
  GslRangeCalendarConfig,
  RangeCalendarDecorator,
  RangeCalendarEntry,
} from './rangeCalendar.domain';

export const rangeCalendarShortcutType = createShortcutType<
  RangeCalendarEntry,
  RangeCalendarDecorator,
  GslRangeCalendarConfig
>({
  itemType: 'RANGE_CALENDAR',
  kind: 'input',
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
    ...(def.validator != null
      ? { validator: buildTypedValidator(def.validator as any, 'array') }
      : {}),
    props: extractWidgetProps(def),
  }),
});

export const _gslRangeCalendars = rangeCalendarShortcutType.gsl;
export const _gslRangeCalendarByUid = rangeCalendarShortcutType.gslByUid;
