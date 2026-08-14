import { createShortcutType } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel, processAutoPlaceholder } from '@golemui/dx';
import type {
  GslMultiDropdownConfig,
  MultiDropdownDecorator,
  MultiDropdownEntry,
} from './multi-dropdown.domain';

export const multiDropdownShortcutType = createShortcutType<
  MultiDropdownEntry,
  MultiDropdownDecorator,
  GslMultiDropdownConfig
>({
  itemType: 'MULTI_DROPDOWN',
  kind: 'input',
  entryShape: 'keyed',
  sensibleDefaults: {
    base: {
      suppressAutomaticLabels: false,
      suppressAutomaticPlaceholders: false,
    },
    fields: ['suppressAutomaticLabels', 'suppressAutomaticPlaceholders'],
    apply: (def, config) => processAutoPlaceholder(processAutoLabel(def, config), config),
  },
  mapToWidget: (def) => ({
    uid: def.uid ?? '',
    kind: 'input',
    type: 'multiDropdown',
    path: def.path ?? '',
    ...(def.label != null ? { label: def.label } : {}),
    ...(def.disabled != null ? { disabled: def.disabled } : {}),
    ...(def.readonly != null ? { readonly: def.readonly } : {}),
    ...(def.validator != null ? { validator: def.validator } : {}),
    props: extractWidgetProps(def),
  }),
});

export const _gslMultiDropdowns = multiDropdownShortcutType.gsl;
export const _gslMultiDropdownByUid = multiDropdownShortcutType.gslByUid;
