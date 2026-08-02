import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel, processAutoPlaceholder } from '@golemui/dx';
import type {
  GslRangeDatePickerConfig,
  RangeDatePickerDecorator,
  RangeDatePickerEntry,
} from './rangeDatePicker.domain';

export const rangeDatePickerShortcutType = createShortcutType<
  RangeDatePickerEntry,
  RangeDatePickerDecorator,
  GslRangeDatePickerConfig
>({
  itemType: 'RANGE_DATE_PICKER',
  kind: 'input',
  entryShape: 'keyed',
  sensibleDefaults: {
    base: {
      suppressAutomaticLabels: false,
      suppressAutomaticPlaceholders: false,
    },
    fields: ['suppressAutomaticLabels', 'suppressAutomaticPlaceholders'],
    apply: (def, config) => processAutoPlaceholder(processAutoLabel(def, config), config),
  },
  mapToWidget: (def) => ({
    uid: def.uid ?? '',
    kind: 'input',
    type: 'rangeDatePicker',
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

export const _gslRangeDatePickers = rangeDatePickerShortcutType.gsl;
export const _gslRangeDatePickerByUid = rangeDatePickerShortcutType.gslByUid;
