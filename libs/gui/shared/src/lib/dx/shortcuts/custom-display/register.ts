import { defineShortcutType } from '../../core/defineShortcutType';
import type {
  CustomDisplayDecorator,
  CustomDisplayEntry,
  GslCustomDisplayConfig,
} from './customDisplay.domain';

export const { gsl: _gslCustomDisplays, gslByUid: _gslCustomDisplayByUid } = defineShortcutType<
  CustomDisplayEntry,
  CustomDisplayDecorator,
  GslCustomDisplayConfig
>({
  itemType: 'CUSTOM_DISPLAY',
  entryShape: 'bare',
  mapToWidget: (def) => ({
    uid: def.uid ?? '',
    kind: 'display',
    type: def.customType,
    props: def.props ?? {},
  }),
});
