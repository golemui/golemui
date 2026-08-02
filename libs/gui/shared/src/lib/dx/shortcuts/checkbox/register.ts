import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type { CheckboxDecorator, CheckboxEntry, GslCheckboxConfig } from './checkbox.domain';

export const checkboxShortcutType = createShortcutType<
  CheckboxEntry,
  CheckboxDecorator,
  GslCheckboxConfig
>({
  itemType: 'CHECKBOX',
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
    type: 'checkbox',
    path: def.path ?? '',
    ...(def.label != null ? { label: def.label } : {}),
    ...(def.disabled != null ? { disabled: def.disabled } : {}),
    ...(def.readonly != null ? { readonly: def.readonly } : {}),
    ...(def.validator != null
      ? { validator: buildTypedValidator(def.validator as any, 'boolean') }
      : {}),
    props: extractWidgetProps(def),
  }),
});

export const _gslCheckboxes = checkboxShortcutType.gsl;
export const _gslCheckboxByUid = checkboxShortcutType.gslByUid;
