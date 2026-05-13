// Complexity: MODERATE — bare entry shape with afterMerge hook for onClick wiring.
// The hook pattern is straightforward; the onClick service does the heavy lifting.
import { ActionWidget, NonFunctionWidget, UiState } from '@golemui/core';
import { defineShortcutType } from '../../core/defineShortcutType';
import { ActionDecorator, ActionEntry, GslActionsConfig } from './actions.domain';
import eventWiringService from '../../core/eventWiring.service';

function mapToWidget<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
  def: ActionDecorator,
): NonFunctionWidget<StateKeys, FormData> {
  const {
    uid,
    label,
    disabled,
    on,
    onClick: _onClick,
    data: _data,
    type: _type,
    tags: _tags,
    size: _size,
    include: _include,
    exclude: _exclude,
    states: _states,
    ...buttonProps
  } = def;
  return {
    uid: uid ?? '',
    kind: 'action',
    type: 'button',
    disabled,
    label,
    ...(on != null ? { on } : {}),
    props: buttonProps,
  } as ActionWidget<StateKeys, FormData>;
}

export const { gsl: _gslActions, gslByUid: _gslActionByUid } = defineShortcutType<
  ActionEntry,
  ActionDecorator,
  GslActionsConfig
>({
  itemType: 'ACTIONS',
  entryShape: 'bare',
  mapToWidget,
  afterMerge: (mergeResult, context) =>
    eventWiringService.extractOnClickFromMergeResult(
      mergeResult,
      context.eventRegistry,
      context.formConfig,
      context.eventIdGenerator,
    ),
});
