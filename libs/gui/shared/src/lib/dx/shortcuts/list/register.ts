import { createShortcutType } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type { GslListConfig, ListDecorator, ListEntry } from './list.domain';

export const listShortcutType = createShortcutType<ListEntry, ListDecorator, GslListConfig>({
  itemType: 'LIST',
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
    type: 'list',
    path: def.path ?? '',
    ...(def.label != null ? { label: def.label } : {}),
    ...(def.disabled != null ? { disabled: def.disabled } : {}),
    ...(def.readonly != null ? { readonly: def.readonly } : {}),
    ...(def.validator != null ? { validator: def.validator } : {}),
    props: extractWidgetProps(def),
  }),
});

export const _gslLists = listShortcutType.gsl;
export const _gslListByUid = listShortcutType.gslByUid;
