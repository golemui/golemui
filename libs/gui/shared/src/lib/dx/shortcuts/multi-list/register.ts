import { createShortcutType } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type { GslMultiListConfig, MultiListDecorator, MultiListEntry } from './multi-list.domain';

export const multiListShortcutType = createShortcutType<
  MultiListEntry,
  MultiListDecorator,
  GslMultiListConfig
>({
  itemType: 'MULTI_LIST',
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
    type: 'multiList',
    path: def.path ?? '',
    ...(def.label != null ? { label: def.label } : {}),
    ...(def.disabled != null ? { disabled: def.disabled } : {}),
    ...(def.readonly != null ? { readonly: def.readonly } : {}),
    ...(def.validator != null ? { validator: def.validator } : {}),
    props: extractWidgetProps(def),
  }),
});

export const _gslMultiLists = multiListShortcutType.gsl;
export const _gslMultiListByUid = multiListShortcutType.gslByUid;
