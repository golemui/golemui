import {
  ActionWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import { GslLeafSelector, MergeResult } from '../../core/dx.domain';
import {
  registerItemType,
  ItemTypeHandler,
  ParsedEntry,
  AfterMergeContext,
} from '../../core/itemTypeRegistry';
import { ActionDecorator, ActionEntry, ActionSensibleDefaultsConfig } from './actions.domain';
import actionOnClickService from '../../core/actionOnClick.service';

function rollUpSensibleDefaults(_leafSelectors: GslLeafSelector[]): ActionSensibleDefaultsConfig {
  return {} as ActionSensibleDefaultsConfig;
}

function applySensibleDefaults(
  def: ActionDecorator,
  _config: ActionSensibleDefaultsConfig,
): ActionDecorator {
  return def;
}

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

function parseEntry(entry: ActionEntry): ParsedEntry<ActionDecorator> {
  // ActionEntry is either an ActionDecorator or an ActionDefCallback (bare, no key)
  return { baseDef: entry };
}

function afterMerge(
  mergeResult: MergeResult,
  context: AfterMergeContext,
): MergeResult {
  return actionOnClickService.extractOnClickFromMergeResult(
    mergeResult,
    context.onClickRegistry,
    context.rootDefaults,
  );
}

const handler: ItemTypeHandler<ActionEntry, ActionDecorator, ActionSensibleDefaultsConfig> = {
  rollUpSensibleDefaults,
  applySensibleDefaults,
  mapToWidget,
  parseEntry,
  afterMerge,
};

registerItemType('ACTIONS', handler);
