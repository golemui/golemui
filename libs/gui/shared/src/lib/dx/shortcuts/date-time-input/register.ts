import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type {
  DateTimeInputDecorator,
  DateTimeInputEntry,
  GslDateTimeInputConfig,
} from './dateTimeInput.domain';

export const dateTimeInputShortcutType = createShortcutType<
  DateTimeInputEntry,
  DateTimeInputDecorator,
  GslDateTimeInputConfig
>({
  itemType: 'DATE_TIME_INPUT',
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
    type: 'dateTimeInput',
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

export const _gslDateTimeInputs = dateTimeInputShortcutType.gsl;
export const _gslDateTimeInputByUid = dateTimeInputShortcutType.gslByUid;
