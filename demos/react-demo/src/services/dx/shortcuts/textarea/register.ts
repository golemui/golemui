import { createGslSelector } from '../../core/dxUtilityTypes';
import { defineShortcutType } from '../../core/defineShortcutType';
import { processAutoLabel, processAutoPlaceholder } from '../../core/sharedSensibleDefaults.service';
import type { GslTextareaConfig, TextareaDecorator, TextareaEntry } from './textarea.domain';

defineShortcutType<TextareaEntry, TextareaDecorator, GslTextareaConfig>({
  itemType: 'TEXTAREA',
  entryShape: 'keyed',
  sensibleDefaults: {
    base: { suppressAutomaticLabels: false, suppressAutomaticPlaceholders: false },
    fields: ['suppressAutomaticLabels', 'suppressAutomaticPlaceholders'],
    apply: (def, config) => processAutoPlaceholder(processAutoLabel(def, config), config),
  },
  mapToWidget: (def) => ({
    uid: def.uid ?? '', kind: 'input', type: 'textarea', path: def.path ?? '',
    ...(def.label != null ? { label: def.label } : {}),
    ...(def.disabled != null ? { disabled: def.disabled } : {}),
    props: def.placeholder != null ? { ...def.props, placeholder: def.placeholder } : { ...def.props },
  }),
});

export const _gslTextarea = createGslSelector<TextareaDecorator, GslTextareaConfig>('TEXTAREA');
