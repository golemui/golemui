import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel, processAutoPlaceholder } from '@golemui/dx';
import type { GslTextareaConfig, TextareaDecorator, TextareaEntry } from './textarea.domain';

export const textareaShortcutType = createShortcutType<
  TextareaEntry,
  TextareaDecorator,
  GslTextareaConfig
>({
  itemType: 'TEXTAREA',
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
    type: 'textarea',
    path: def.path ?? '',
    ...(def.label != null ? { label: def.label } : {}),
    ...(def.disabled != null ? { disabled: def.disabled } : {}),
    ...(def.readonly != null ? { readonly: def.readonly } : {}),
    ...(def.validator != null
      ? { validator: buildTypedValidator(def.validator as any, 'string') }
      : {}),
    props: extractWidgetProps(def),
  }),
});

export const _gslTextareas = textareaShortcutType.gsl;
export const _gslTextareaByUid = textareaShortcutType.gslByUid;
