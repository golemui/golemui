// Complexity: STANDARD — typical keyed input with sensible defaults and pass-through props.
// This is the pattern most new shortcuts follow. See SHORTCUTS.md for the progression.
import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel, processAutoPlaceholder } from '@golemui/dx';
import type {
  TimePickerDecorator,
  TimePickerEntry,
  GslTimePickerConfig,
} from './timePicker.domain';

export const timePickerShortcutType = createShortcutType<
  TimePickerEntry,
  TimePickerDecorator,
  GslTimePickerConfig
>({
  itemType: 'TIME_PICKER',
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
    type: 'timePicker',
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

export const _gslTimePickers = timePickerShortcutType.gsl;
export const _gslTimePickerByUid = timePickerShortcutType.gslByUid;
