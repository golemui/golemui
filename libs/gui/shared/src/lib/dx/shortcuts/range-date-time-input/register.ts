import { defineShortcutType } from '../../core/defineShortcutType';
import { buildTypedValidator } from '../../core/dxValidatorHelper';
import { extractWidgetProps } from '../../core/dxPropsHelper';
import { processAutoLabel } from '../../core/sharedSensibleDefaults.service';
import type {
  GslRangeDateTimeInputConfig,
  RangeDateTimeInputDecorator,
  RangeDateTimeInputEntry,
} from './rangeDateTimeInput.domain';

export const { gsl: _gslRangeDateTimeInputs, gslByUid: _gslRangeDateTimeInputByUid } =
  defineShortcutType<
    RangeDateTimeInputEntry,
    RangeDateTimeInputDecorator,
    GslRangeDateTimeInputConfig
  >({
    itemType: 'RANGE_DATE_TIME_INPUT',
    entryShape: 'keyed',
    sensibleDefaults: {
      base: { suppressAutomaticLabels: false },
      fields: ['suppressAutomaticLabels'],
      apply: (def, config) => processAutoLabel(def, config),
    },
    mapToWidget: (def) => ({
      uid: def.uid ?? '',
      kind: 'input',
      type: 'rangeDateTimeInput',
      path: def.path ?? '',
      ...(def.label != null ? { label: def.label } : {}),
      ...(def.disabled != null ? { disabled: def.disabled } : {}),
      ...(def.readonly != null ? { readonly: def.readonly } : {}),
      ...(def.validator != null
        ? { validator: buildTypedValidator(def.validator as any, 'array') }
        : {}),
      props: extractWidgetProps(def),
    }),
  });
