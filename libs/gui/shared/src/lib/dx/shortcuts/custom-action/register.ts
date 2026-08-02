import { createShortcutType } from '@golemui/dx';
import type {
  CustomActionDecorator,
  CustomActionEntry,
  GslCustomActionConfig,
} from './customAction.domain';
import { eventWiringService } from '@golemui/dx';

export const customActionShortcutType = createShortcutType<
  CustomActionEntry,
  CustomActionDecorator,
  GslCustomActionConfig
>({
  itemType: 'CUSTOM_ACTION',
  kind: 'action',
  entryShape: 'bare',
  mapToWidget: (def) => {
    const {
      uid,
      label,
      disabled,
      on,
      onClick: _onClick,
      data: _data,
      customType: _customType,
      tags: _tags,
      size: _size,
      include: _include,
      exclude: _exclude,
      states: _states,
      props: customProps,
      ...rest
    } = def;
    return {
      uid: uid ?? '',
      kind: 'action',
      type: def.customType,
      label,
      disabled,
      ...(on != null ? { on } : {}),
      props: { ...customProps, ...rest },
    };
  },
  afterMerge: (mergeResult, context) =>
    eventWiringService.extractOnClickFromMergeResult(
      mergeResult,
      context.eventRegistry,
      context.eventIdGenerator,
    ),
});

export const _gslCustomActions = customActionShortcutType.gsl;
export const _gslCustomActionByUid = customActionShortcutType.gslByUid;
