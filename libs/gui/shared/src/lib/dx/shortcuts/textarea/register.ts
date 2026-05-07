import { defineShortcutType } from '../../core/defineShortcutType';
import { buildTypedValidator } from '../../core/dxValidatorHelper';
import { extractWidgetProps } from '../../core/dxPropsHelper';
import { processAutoLabel, processAutoPlaceholder } from '../../core/sharedSensibleDefaults.service';
import type { GslTextareaConfig, TextareaDecorator, TextareaEntry } from './textarea.domain';

export const { gsl: _gslTextareas, gslByUid: _gslTextareaByUid } =
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
      ...(def.readonly != null ? { readonly: def.readonly } : {}),
      ...(def.validator != null ? { validator: buildTypedValidator(def.validator as any, 'string') } : {}),
      props: extractWidgetProps(def),
    }),
  });
