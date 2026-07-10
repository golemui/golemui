// Complexity: STANDARD — typical keyed input with sensible defaults and pass-through props.
// This is the pattern most new shortcuts follow. See SHORTCUTS.md for the progression.
import { defineShortcutType } from '../../core/defineShortcutType';
import { buildTypedValidator } from '../../core/dxValidatorHelper';
import { extractWidgetProps } from '../../core/dxPropsHelper';
import {
  processAutoLabel,
  processAutoPlaceholder,
} from '../../core/sharedSensibleDefaults.service';
import type {
  DateTimePickerDecorator,
  DateTimePickerEntry,
  GslDateTimePickerConfig,
} from './dateTimePicker.domain';

export const { gsl: _gslDateTimePickers, gslByUid: _gslDateTimePickerByUid } = defineShortcutType<
  DateTimePickerEntry,
  DateTimePickerDecorator,
  GslDateTimePickerConfig
>({
  itemType: 'DATE_TIME_PICKER',
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
    type: 'dateTimePicker',
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
