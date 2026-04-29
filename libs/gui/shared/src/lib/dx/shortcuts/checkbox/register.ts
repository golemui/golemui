import { defineShortcutType } from '../../core/defineShortcutType';
import { extractWidgetProps } from '../../core/dxPropsHelper';
import { processAutoLabel } from '../../core/sharedSensibleDefaults.service';
import type { CheckboxDecorator, CheckboxEntry, GslCheckboxConfig } from './checkbox.domain';

export const { gsl: _gslCheckboxes, gslByUid: _gslCheckboxByUid } =
  defineShortcutType<CheckboxEntry, CheckboxDecorator, GslCheckboxConfig>({
    itemType: 'CHECKBOX',
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
      ...(def.validator != null ? { validator: { type: 'boolean' as const, ...def.validator } } : {}),
      props: extractWidgetProps(def),
    }),
  });
