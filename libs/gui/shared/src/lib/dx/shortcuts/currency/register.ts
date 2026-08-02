import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel, processAutoPlaceholder } from '@golemui/dx';
import type { CurrencyDecorator, CurrencyEntry, GslCurrencyConfig } from './currency.domain';

export const currencyShortcutType = createShortcutType<
  CurrencyEntry,
  CurrencyDecorator,
  GslCurrencyConfig
>({
  itemType: 'CURRENCY',
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
    type: 'currency',
    path: def.path ?? '',
    ...(def.label != null ? { label: def.label } : {}),
    ...(def.disabled != null ? { disabled: def.disabled } : {}),
    ...(def.readonly != null ? { readonly: def.readonly } : {}),
    ...(def.validator != null
      ? { validator: buildTypedValidator(def.validator as any, 'number') }
      : {}),
    props: extractWidgetProps(def),
  }),
});

export const _gslCurrencies = currencyShortcutType.gsl;
export const _gslCurrencyByUid = currencyShortcutType.gslByUid;
