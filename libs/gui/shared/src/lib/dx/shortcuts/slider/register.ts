import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type { GslSliderConfig, SliderDecorator, SliderEntry } from './slider.domain';

export const sliderShortcutType = createShortcutType<SliderEntry, SliderDecorator, GslSliderConfig>(
  {
    itemType: 'SLIDER',
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
      type: 'slider',
      path: def.path ?? '',
      ...(def.label != null ? { label: def.label } : {}),
      ...(def.disabled != null ? { disabled: def.disabled } : {}),
      ...(def.readonly != null ? { readonly: def.readonly } : {}),
      ...(def.validator != null
        ? { validator: buildTypedValidator(def.validator as any, 'number') }
        : {}),
      props: extractWidgetProps(def),
    }),
  },
);

export const _gslSliders = sliderShortcutType.gsl;
export const _gslSliderByUid = sliderShortcutType.gslByUid;
