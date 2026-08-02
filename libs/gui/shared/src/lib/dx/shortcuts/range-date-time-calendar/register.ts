import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type {
  GslRangeDateTimeCalendarConfig,
  RangeDateTimeCalendarDecorator,
  RangeDateTimeCalendarEntry,
} from './rangeDateTimeCalendar.domain';

export const rangeDateTimeCalendarShortcutType = createShortcutType<
  RangeDateTimeCalendarEntry,
  RangeDateTimeCalendarDecorator,
  GslRangeDateTimeCalendarConfig
>({
  itemType: 'RANGE_DATE_TIME_CALENDAR',
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
    type: 'rangeDateTimeCalendar',
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

export const _gslRangeDateTimeCalendars = rangeDateTimeCalendarShortcutType.gsl;
export const _gslRangeDateTimeCalendarByUid = rangeDateTimeCalendarShortcutType.gslByUid;
