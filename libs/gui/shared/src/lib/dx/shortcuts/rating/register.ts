import { createShortcutType } from '@golemui/dx';
import { buildTypedValidator } from '@golemui/dx';
import { extractWidgetProps } from '@golemui/dx';
import { processAutoLabel } from '@golemui/dx';
import type { GslRatingConfig, RatingDecorator, RatingEntry } from './rating.domain';

export const ratingShortcutType = createShortcutType<RatingEntry, RatingDecorator, GslRatingConfig>(
  {
    itemType: 'RATING',
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
      type: 'rating',
      path: def.path ?? '',
      ...(def.label != null ? { label: def.label } : {}),
      ...(def.disabled != null ? { disabled: def.disabled } : {}),
      ...(def.readonly != null ? { readonly: def.readonly } : {}),
      ...(def.validator != null
        ? { validator: buildTypedValidator(def.validator as any, 'integer') }
        : {}),
      props: extractWidgetProps(def),
    }),
  },
);

export const _gslRatings = ratingShortcutType.gsl;
export const _gslRatingByUid = ratingShortcutType.gslByUid;
