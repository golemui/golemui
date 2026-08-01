import { defineShortcutType } from '../../core/defineShortcutType';
import { buildTypedValidator } from '../../core/dxValidatorHelper';
import { extractWidgetProps } from '../../core/dxPropsHelper';
import { processAutoLabel } from '../../core/sharedSensibleDefaults.service';
import type {
  GslRangeDateTimeCalendarConfig,
  RangeDateTimeCalendarDecorator,
  RangeDateTimeCalendarEntry,
} from './rangeDateTimeCalendar.domain';

export const { gsl: _gslRangeDateTimeCalendars, gslByUid: _gslRangeDateTimeCalendarByUid } =
  defineShortcutType<
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
