import {
  ActionWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import { defineShortcutType } from '../../core/defineShortcutType';
import {
  ActionDecorator,
  ActionEntry,
  GslActionsConfig,
} from './actions.domain';
import actionOnClickService from '../../core/actionOnClick.service';

function mapToWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
>(def: ActionDecorator): NonFunctionWidget<StateKeys, FormData> {
  const {
    uid,
    label,
    disabled,
    on,
    onClick: _onClick,
    data: _data,
    type: _type,
    tags: _tags,
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

export const { gsl: _gslActions, gslById: _gslActionById } =
  defineShortcutType<ActionEntry, ActionDecorator, GslActionsConfig>({
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
