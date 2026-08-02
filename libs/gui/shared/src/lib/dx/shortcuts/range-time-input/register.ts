import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type {
  GslRangeTimeInputConfig,
  RangeTimeInputDecorator,
  RangeTimeInputEntry,
} from './rangeTimeInput.domain';

export const rangeTimeInputShortcutType = createShortcutType<
  RangeTimeInputEntry,
  RangeTimeInputDecorator,
  GslRangeTimeInputConfig
>({
  itemType: 'RANGE_TIME_INPUT',
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
    type: 'rangeTimeInput',
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

export const _gslRangeTimeInputs = rangeTimeInputShortcutType.gsl;
export const _gslRangeTimeInputByUid = rangeTimeInputShortcutType.gslByUid;
