import { createShortcutType } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type {
  CustomInputDecorator,
  CustomInputEntry,
  GslCustomInputConfig,
} from './customInput.domain';

export const customInputShortcutType = createShortcutType<
  CustomInputEntry,
  CustomInputDecorator,
  GslCustomInputConfig
>({
  itemType: 'CUSTOM_INPUT',
  kind: 'input',
  entryShape: 'keyed',
  sensibleDefaults: {
    base: {
      suppressAutomaticLabels: false,
    },
    fields: ['suppressAutomaticLabels'],
    apply: (def, config) => processAutoLabel(def, config),
  },
  mapToWidget: (def) => ({
    uid: def.uid ?? '',
    kind: 'input',
    type: def.customType,
    path: def.path ?? '',
    ...(def.label != null ? { label: def.label } : {}),
    ...(def.disabled != null ? { disabled: def.disabled } : {}),
    ...(def.readonly != null ? { readonly: def.readonly } : {}),
    ...(def.defaultValue != null ? { defaultValue: def.defaultValue } : {}),
    ...(def.validator != null ? { validator: def.validator } : {}),
    props: def.props ?? {},
  }),
});

export const _gslCustomInputs = customInputShortcutType.gsl;
export const _gslCustomInputByUid = customInputShortcutType.gslByUid;
