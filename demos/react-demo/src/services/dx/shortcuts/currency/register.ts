import { defineShortcutType } from '../../core/defineShortcutType';
import { extractWidgetProps } from '../../core/dxPropsHelper';
import { processAutoLabel, processAutoPlaceholder } from '../../core/sharedSensibleDefaults.service';
import type { CurrencyDecorator, CurrencyEntry, GslCurrencyConfig } from './currency.domain';

export const { gsl: _gslCurrency, gslById: _gslCurrencyById } =
  defineShortcutType<CurrencyEntry, CurrencyDecorator, GslCurrencyConfig>({
    itemType: 'CURRENCY',
    entryShape: 'keyed',
    sensibleDefaults: {
      base: { suppressAutomaticLabels: false, suppressAutomaticPlaceholders: false },
      fields: ['suppressAutomaticLabels', 'suppressAutomaticPlaceholders'],
      apply: (def, config) => processAutoPlaceholder(processAutoLabel(def, config), config),
    },
    mapToWidget: (def) => ({
      uid: def.uid ?? '',
      kind: 'input',
      type: 'currency',
      path: def.path ?? '',
      ...(def.label != null ? { label: def.label } : {}),
      ...(def.disabled != null ? { disabled: def.disabled } : {}),
      ...(def.readonly != null ? { readonly: def.readonly } : {}),
      props: extractWidgetProps(def),
    }),
  });
