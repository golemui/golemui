import { defineShortcutType } from '../../core/defineShortcutType';
import { buildTypedValidator } from '../../core/dxValidatorHelper';
import { extractWidgetProps } from '../../core/dxPropsHelper';
import { processAutoLabel } from '../../core/sharedSensibleDefaults.service';
import type {
  GslRangeDateTimePickerConfig,
  RangeDateTimePickerDecorator,
  RangeDateTimePickerEntry,
} from './rangeDateTimePicker.domain';

export const { gsl: _gslRangeDateTimePickers, gslByUid: _gslRangeDateTimePickerByUid } =
  defineShortcutType<
    RangeDateTimePickerEntry,
    RangeDateTimePickerDecorator,
    GslRangeDateTimePickerConfig
  >({
    itemType: 'RANGE_DATE_TIME_PICKER',
    entryShape: 'keyed',
    sensibleDefaults: {
      base: { suppressAutomaticLabels: false },
      fields: ['suppressAutomaticLabels'],
      apply: (def, config) => processAutoLabel(def, config),
    },
    mapToWidget: (def) => ({
      uid: def.uid ?? '',
      kind: 'input',
      type: 'rangeDateTimePicker',
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
