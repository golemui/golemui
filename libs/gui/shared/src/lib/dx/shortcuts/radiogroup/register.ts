import { defineShortcutType } from '../../core/defineShortcutType';
import { extractWidgetProps } from '../../core/dxPropsHelper';
import { processAutoLabel } from '../../core/sharedSensibleDefaults.service';
import type {
  GslRadiogroupConfig,
  RadiogroupDecorator,
  RadiogroupEntry,
} from './radiogroup.domain';

export const { gsl: _gslRadiogroups, gslByUid: _gslRadiogroupByUid } =
  defineShortcutType<RadiogroupEntry, RadiogroupDecorator, GslRadiogroupConfig>({
    itemType: 'RADIOGROUP',
    entryShape: 'keyed',
    sensibleDefaults: {
      base: { suppressAutomaticLabels: false },
      fields: ['suppressAutomaticLabels'],
      apply: (def, config) => processAutoLabel(def, config),
    },
    mapToWidget: (def) => ({
      uid: def.uid ?? '',
      kind: 'input',
      type: 'radiogroup',
      path: def.path ?? '',
      ...(def.label != null ? { label: def.label } : {}),
      ...(def.disabled != null ? { disabled: def.disabled } : {}),
      ...(def.readonly != null ? { readonly: def.readonly } : {}),
      props: extractWidgetProps(def),
    }),
  });
