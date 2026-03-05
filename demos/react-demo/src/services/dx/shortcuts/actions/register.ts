import {
  ActionWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import { defineShortcutType } from '../../core/defineShortcutType';
import { ActionDecorator, ActionEntry, ActionSensibleDefaultsConfig } from './actions.domain';
import actionOnClickService from '../../core/actionOnClick.service';

function mapToWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
>(def: ActionDecorator): NonFunctionWidget<StateKeys, FormData> {
  return {
    uid: def.uid ?? '',
    kind: 'action',
    type: 'button',
    disabled: def.disabled,
    label: def.label,
    ...(def.on != null ? { on: def.on } : {}),
    props: { ...def.props },
  } as ActionWidget<StateKeys, FormData>;
}

defineShortcutType<ActionEntry, ActionDecorator, ActionSensibleDefaultsConfig>({
  itemType: 'ACTIONS',
  entryShape: 'bare',
  mapToWidget,
  afterMerge: (mergeResult, context) =>
    actionOnClickService.extractOnClickFromMergeResult(
      mergeResult,
      context.onClickRegistry,
      context.rootDefaults,
    ),
});
