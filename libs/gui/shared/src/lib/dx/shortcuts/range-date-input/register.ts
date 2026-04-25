import { defineShortcutType } from '../../core/defineShortcutType';
import { extractWidgetProps } from '../../core/dxPropsHelper';
import { processAutoLabel } from '../../core/sharedSensibleDefaults.service';
import type { GslRangeDateInputConfig, RangeDateInputDecorator, RangeDateInputEntry } from './rangeDateInput.domain';

export const { gsl: _gslRangeDateInputs, gslByUid: _gslRangeDateInputByUid } =
  defineShortcutType<RangeDateInputEntry, RangeDateInputDecorator, GslRangeDateInputConfig>({
    itemType: 'RANGE_DATE_INPUT',
    entryShape: 'keyed',
    sensibleDefaults: {
      base: { suppressAutomaticLabels: false },
      fields: ['suppressAutomaticLabels'],
      apply: (def, config) => processAutoLabel(def, config),
    },
    mapToWidget: (def) => ({
      uid: def.uid ?? '',
      kind: 'input',
      type: 'rangeDateInput',
      path: def.path ?? '',
      ...(def.label != null ? { label: def.label } : {}),
      ...(def.disabled != null ? { disabled: def.disabled } : {}),
      ...(def.readonly != null ? { readonly: def.readonly } : {}),
      props: extractWidgetProps(def),
    }),
  });
