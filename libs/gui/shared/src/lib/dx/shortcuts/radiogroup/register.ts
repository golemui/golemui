import { createShortcutType } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type {
  GslRadiogroupConfig,
  RadiogroupDecorator,
  RadiogroupEntry,
} from './radiogroup.domain';

export const radiogroupShortcutType = createShortcutType<
  RadiogroupEntry,
  RadiogroupDecorator,
  GslRadiogroupConfig
>({
  itemType: 'RADIOGROUP',
  kind: 'input',
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
    ...(def.validator != null ? { validator: def.validator } : {}),
    props: extractWidgetProps(def),
  }),
});

export const _gslRadiogroups = radiogroupShortcutType.gsl;
export const _gslRadiogroupByUid = radiogroupShortcutType.gslByUid;
