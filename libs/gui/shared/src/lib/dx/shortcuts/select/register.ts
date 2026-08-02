import { createShortcutType } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel, processAutoPlaceholder } from '@golemui/dx';
import type { GslSelectConfig, SelectDecorator, SelectEntry } from './select.domain';

export const selectShortcutType = createShortcutType<SelectEntry, SelectDecorator, GslSelectConfig>(
  {
    itemType: 'SELECT',
    kind: 'input',
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
  },
);

export const _gslSelects = selectShortcutType.gsl;
export const _gslSelectByUid = selectShortcutType.gslByUid;
