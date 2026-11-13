import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type {
  CheckboxGroupDecorator,
  CheckboxGroupEntry,
  GslCheckboxGroupConfig,
} from './checkbox-group.domain';

export const checkboxGroupShortcutType = createShortcutType<
  CheckboxGroupEntry,
  CheckboxGroupDecorator,
  GslCheckboxGroupConfig
>({
  itemType: 'CHECKBOX_GROUP',
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
    type: 'checkboxGroup',
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

export const _gslCheckboxGroups = checkboxGroupShortcutType.gsl;
export const _gslCheckboxGroupByUid = checkboxGroupShortcutType.gslByUid;
