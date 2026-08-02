import { createShortcutType } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel, processAutoPlaceholder } from '@golemui/dx';
import type { DropdownDecorator, DropdownEntry, GslDropdownConfig } from './dropdown.domain';

export const dropdownShortcutType = createShortcutType<
  DropdownEntry,
  DropdownDecorator,
  GslDropdownConfig
>({
  itemType: 'DROPDOWN',
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
    type: 'dropdown',
    path: def.path ?? '',
    ...(def.label != null ? { label: def.label } : {}),
    ...(def.disabled != null ? { disabled: def.disabled } : {}),
    ...(def.readonly != null ? { readonly: def.readonly } : {}),
    ...(def.validator != null ? { validator: def.validator } : {}),
    props: extractWidgetProps(def),
  }),
});

export const _gslDropdowns = dropdownShortcutType.gsl;
export const _gslDropdownByUid = dropdownShortcutType.gslByUid;
