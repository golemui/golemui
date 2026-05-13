import { defineShortcutType } from '../../core/defineShortcutType';
import { extractWidgetProps } from '../../core/dxPropsHelper';
import {
  processAutoLabel,
  processAutoPlaceholder,
} from '../../core/sharedSensibleDefaults.service';
import type { GslSelectConfig, SelectDecorator, SelectEntry } from './select.domain';

export const { gsl: _gslSelects, gslByUid: _gslSelectByUid } = defineShortcutType<
  SelectEntry,
  SelectDecorator,
  GslSelectConfig
>({
  itemType: 'SELECT',
  entryShape: 'keyed',
  sensibleDefaults: {
    base: { suppressAutomaticLabels: false, suppressAutomaticPlaceholders: false },
    fields: ['suppressAutomaticLabels', 'suppressAutomaticPlaceholders'],
    apply: (def, config) => processAutoPlaceholder(processAutoLabel(def, config), config),
  },
  mapToWidget: (def) => ({
    uid: def.uid ?? '',
    kind: 'input',
    type: 'select',
    path: def.path ?? '',
    ...(def.label != null ? { label: def.label } : {}),
    ...(def.disabled != null ? { disabled: def.disabled } : {}),
    ...(def.readonly != null ? { readonly: def.readonly } : {}),
    ...(def.validator != null ? { validator: def.validator } : {}),
    props: extractWidgetProps(def),
  }),
});
