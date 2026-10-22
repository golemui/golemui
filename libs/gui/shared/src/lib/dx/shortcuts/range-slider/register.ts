import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type {
  GslRangeSliderConfig,
  RangeSliderDecorator,
  RangeSliderEntry,
} from './range-slider.domain';

export const rangeSliderShortcutType = createShortcutType<
  RangeSliderEntry,
  RangeSliderDecorator,
  GslRangeSliderConfig
>({
  itemType: 'RANGE_SLIDER',
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
    type: 'rangeSlider',
    path: def.path ?? '',
    ...(def.label != null ? { label: def.label } : {}),
    ...(def.disabled != null ? { disabled: def.disabled } : {}),
    ...(def.readonly != null ? { readonly: def.readonly } : {}),
    ...(def.validator != null
      ? { validator: buildTypedValidator(def.validator as any, 'range') }
      : {}),
    props: extractWidgetProps(def),
  }),
});

export const _gslRangeSliders = rangeSliderShortcutType.gsl;
export const _gslRangeSliderByUid = rangeSliderShortcutType.gslByUid;
