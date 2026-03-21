import { defineShortcutType } from '../../core/defineShortcutType';
import type {
  CustomActionDecorator,
  CustomActionEntry,
  GslCustomActionConfig,
} from './customAction.domain';
import eventWiringService from '../../core/eventWiring.service';

export const { gsl: _gslCustomActions, gslById: _gslCustomActionById } = defineShortcutType<
  CustomActionEntry,
  CustomActionDecorator,
  GslCustomActionConfig
>({
  itemType: 'CUSTOM_ACTION',
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
      context.formConfig,
      context.eventIdGenerator,
    ),
});
