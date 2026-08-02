import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import {
  type CalendarDecorator,
  type CalendarEntry,
  type GslCalendarConfig,
} from './calendar.domain';

export const calendarShortcutType = createShortcutType<
  CalendarEntry,
  CalendarDecorator,
  GslCalendarConfig
>({
  itemType: 'CALENDAR',
  kind: 'input',
  entryShape: 'bare',
  sensibleDefaults: {
    base: { suppressAutomaticLabels: false },
    fields: ['suppressAutomaticLabels'],
    apply: (def, config) => processAutoLabel(def, config),
  },
  mapToWidget: (def) => ({
    uid: def.uid ?? '',
    kind: 'input',
    type: 'calendar',
    path: def.path ?? '',
    ...(def.label != null ? { label: def.label } : {}),
    ...(def.disabled != null ? { disabled: def.disabled } : {}),
    ...(def.readonly != null ? { readonly: def.readonly } : {}),
    ...(def.validator != null
      ? { validator: buildTypedValidator(def.validator as any, 'string') }
      : {}),
    props: extractWidgetProps(def),
  }),
});

export const _gslCalendars = calendarShortcutType.gsl;
export const _gslCalendarByUid = calendarShortcutType.gslByUid;
