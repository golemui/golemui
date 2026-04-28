import { defineShortcutType } from '../../core/defineShortcutType';
import { extractWidgetProps } from '../../core/dxPropsHelper';
import { processAutoLabel } from '../../core/sharedSensibleDefaults.service';
import type { DateInputDecorator, DateInputEntry, GslDateInputConfig } from './dateInput.domain';

export const { gsl: _gslDateInputs, gslByUid: _gslDateInputByUid } =
  defineShortcutType<DateInputEntry, DateInputDecorator, GslDateInputConfig>({
    itemType: 'DATE_INPUT',
    entryShape: 'keyed',
    sensibleDefaults: {
      base: { suppressAutomaticLabels: false },
      fields: ['suppressAutomaticLabels'],
      apply: (def, config) => processAutoLabel(def, config),
    },
    mapToWidget: (def) => ({
      uid: def.uid ?? '',
      kind: 'input',
      type: 'dateInput',
      path: def.path ?? '',
      ...(def.label != null ? { label: def.label } : {}),
      ...(def.disabled != null ? { disabled: def.disabled } : {}),
      ...(def.readonly != null ? { readonly: def.readonly } : {}),
      ...(def.validator != null ? { validator: { type: 'string' as const, ...def.validator } } : {}),
      props: extractWidgetProps(def),
    }),
  });
