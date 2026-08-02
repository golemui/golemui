import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type {
  GslRangeDateTimePickerConfig,
  RangeDateTimePickerDecorator,
  RangeDateTimePickerEntry,
} from './rangeDateTimePicker.domain';

export const rangeDateTimePickerShortcutType = createShortcutType<
  RangeDateTimePickerEntry,
  RangeDateTimePickerDecorator,
  GslRangeDateTimePickerConfig
>({
  itemType: 'RANGE_DATE_TIME_PICKER',
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
    type: 'rangeDateTimePicker',
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

export const _gslRangeDateTimePickers = rangeDateTimePickerShortcutType.gsl;
export const _gslRangeDateTimePickerByUid = rangeDateTimePickerShortcutType.gslByUid;
