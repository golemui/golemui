import {
  ActionWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import { GslLeafSelector } from '../../core/dx.domain';
import { registerItemType, ItemTypeHandler } from '../../core/itemTypeRegistry';
import { ActionDecorator, ActionEntry } from './actions.domain';

function rollUpSensibleDefaults(_leafSelectors: GslLeafSelector[]): Record<string, any> {
  return {};
}

function applySensibleDefaults(
  def: Record<string, any>,
  _config: Record<string, any>,
): Record<string, any> {
  return def;
}

function mapToWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
>(def: Record<string, any>): NonFunctionWidget<StateKeys, FormData> {
  const controllerDef = def as ActionDecorator & Record<string, any>;
  return {
    uid: controllerDef.uid ?? '',
    kind: 'action',
    type: 'button',
    disabled: controllerDef.disabled,
    label: controllerDef.label,
    ...(controllerDef.on != null ? { on: controllerDef.on } : {}),
  } as ActionWidget<StateKeys, FormData>;
}

function parseEntry(entry: any): { baseDef: any; path?: string } {
  // ActionEntry is either an ActionDecorator or an ActionDefCallback (bare, no key)
  const actionEntry = entry as ActionEntry;
  return { baseDef: actionEntry };
}

const handler: ItemTypeHandler = {
  rollUpSensibleDefaults,
  applySensibleDefaults,
  mapToWidget,
  parseEntry,
};

registerItemType('ACTIONS', handler);
