import { defineShortcutType } from '../../core/defineShortcutType';
import { buildTypedValidator } from '../../core/dxValidatorHelper';
import { extractWidgetProps } from '../../core/dxPropsHelper';
import {
  processAutoLabel,
  processAutoPlaceholder,
} from '../../core/sharedSensibleDefaults.service';
import type {
  GslRangeDatePickerConfig,
  RangeDatePickerDecorator,
  RangeDatePickerEntry,
} from './rangeDatePicker.domain';

export const { gsl: _gslRangeDatePickers, gslByUid: _gslRangeDatePickerByUid } = defineShortcutType<
  RangeDatePickerEntry,
  RangeDatePickerDecorator,
  GslRangeDatePickerConfig
>({
  itemType: 'RANGE_DATE_PICKER',
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
