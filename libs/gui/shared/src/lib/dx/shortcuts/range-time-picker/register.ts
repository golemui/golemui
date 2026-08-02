import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type {
  GslRangeTimePickerConfig,
  RangeTimePickerDecorator,
  RangeTimePickerEntry,
} from './rangeTimePicker.domain';

export const rangeTimePickerShortcutType = createShortcutType<
  RangeTimePickerEntry,
  RangeTimePickerDecorator,
  GslRangeTimePickerConfig
>({
  itemType: 'RANGE_TIME_PICKER',
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
    type: 'rangeTimePicker',
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

export const _gslRangeTimePickers = rangeTimePickerShortcutType.gsl;
export const _gslRangeTimePickerByUid = rangeTimePickerShortcutType.gslByUid;
