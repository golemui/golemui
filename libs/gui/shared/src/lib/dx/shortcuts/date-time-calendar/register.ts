import { defineShortcutType } from '../../core/defineShortcutType';
import { buildTypedValidator } from '../../core/dxValidatorHelper';
import { extractWidgetProps } from '../../core/dxPropsHelper';
import { processAutoLabel } from '../../core/sharedSensibleDefaults.service';
import {
  type DateTimeCalendarDecorator,
  type DateTimeCalendarEntry,
  type GslDateTimeCalendarConfig,
} from './dateTimeCalendar.domain';

export const { gsl: _gslDateTimeCalendars, gslByUid: _gslDateTimeCalendarByUid } =
  defineShortcutType<DateTimeCalendarEntry, DateTimeCalendarDecorator, GslDateTimeCalendarConfig>({
    itemType: 'DATE_TIME_CALENDAR',
    entryShape: 'bare',
    sensibleDefaults: {
      base: { suppressAutomaticLabels: false },
      fields: ['suppressAutomaticLabels'],
      apply: (def, config) => processAutoLabel(def, config),
    },
    mapToWidget: (def) => ({
      uid: def.uid ?? '',
      kind: 'input',
      type: 'dateTimeCalendar',
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
