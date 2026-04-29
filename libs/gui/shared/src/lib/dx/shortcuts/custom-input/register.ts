import { defineShortcutType } from '../../core/defineShortcutType';
import { processAutoLabel } from '../../core/sharedSensibleDefaults.service';
import type {
  CustomInputDecorator,
  CustomInputEntry,
  GslCustomInputConfig,
} from './customInput.domain';

export const { gsl: _gslCustomInputs, gslByUid: _gslCustomInputByUid } = defineShortcutType<
  CustomInputEntry,
  CustomInputDecorator,
  GslCustomInputConfig
>({
  itemType: 'CUSTOM_INPUT',
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
    props: def.props ?? {},
  }),
});
