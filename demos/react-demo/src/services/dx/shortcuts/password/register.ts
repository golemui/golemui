import { defineShortcutType } from '../../core/defineShortcutType';
import { extractWidgetProps } from '../../core/dxPropsHelper';
import { processAutoLabel, processAutoPlaceholder } from '../../core/sharedSensibleDefaults.service';
import type { GslPasswordConfig, PasswordDecorator, PasswordEntry } from './password.domain';

export const { gsl: _gslPassword, gslById: _gslPasswordById } =
  defineShortcutType<PasswordEntry, PasswordDecorator, GslPasswordConfig>({
    itemType: 'PASSWORD',
    entryShape: 'keyed',
    sensibleDefaults: {
      base: { suppressAutomaticLabels: false, suppressAutomaticPlaceholders: false },
      fields: ['suppressAutomaticLabels', 'suppressAutomaticPlaceholders'],
      apply: (def, config) => processAutoPlaceholder(processAutoLabel(def, config), config),
    },
    mapToWidget: (def) => ({
      uid: def.uid ?? '',
      kind: 'input',
      type: 'password',
      path: def.path ?? '',
      ...(def.label != null ? { label: def.label } : {}),
      ...(def.disabled != null ? { disabled: def.disabled } : {}),
      ...(def.readonly != null ? { readonly: def.readonly } : {}),
      props: extractWidgetProps(def),
    }),
  });
