import { createShortcutType } from '@golemui/dx';
import type {
  CustomDisplayDecorator,
  CustomDisplayEntry,
  GslCustomDisplayConfig,
} from './customDisplay.domain';

export const customDisplayShortcutType = createShortcutType<
  CustomDisplayEntry,
  CustomDisplayDecorator,
  GslCustomDisplayConfig
>({
  itemType: 'CUSTOM_DISPLAY',
  kind: 'display',
  entryShape: 'bare',
  mapToWidget: (def) => ({
    uid: def.uid ?? '',
    kind: 'display',
    type: def.customType,
    props: def.props ?? {},
  }),
});

export const _gslCustomDisplays = customDisplayShortcutType.gsl;
export const _gslCustomDisplayByUid = customDisplayShortcutType.gslByUid;
