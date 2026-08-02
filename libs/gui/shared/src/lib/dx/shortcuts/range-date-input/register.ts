import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type {
  GslRangeDateInputConfig,
  RangeDateInputDecorator,
  RangeDateInputEntry,
} from './rangeDateInput.domain';

export const rangeDateInputShortcutType = createShortcutType<
  RangeDateInputEntry,
  RangeDateInputDecorator,
  GslRangeDateInputConfig
>({
  itemType: 'RANGE_DATE_INPUT',
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
    type: 'rangeDateInput',
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

export const _gslRangeDateInputs = rangeDateInputShortcutType.gsl;
export const _gslRangeDateInputByUid = rangeDateInputShortcutType.gslByUid;
