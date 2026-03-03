import {
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import { GslLeafSelector } from '../../core/dx.domain';
import { registerItemType, ItemTypeHandler } from '../../core/itemTypeRegistry';
import { DisplayDecorator } from './display.domain';

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
  const displayDef = def as DisplayDecorator;
  return {
    uid: '',
    kind: 'display' as any,
    type: 'renderer',
    props: { render: displayDef.render },
  } as unknown as NonFunctionWidget<StateKeys, FormData>;
}

function parseEntry(_entry: any): { baseDef: any; path?: string } {
  // Displays are handled by processDisplayItem, not the generic pipeline.
  // This should never be called.
  throw new Error('Displays are processed via processDisplayItem, not parseEntry.');
}

const handler: ItemTypeHandler = {
  rollUpSensibleDefaults,
  applySensibleDefaults,
  mapToWidget,
  parseEntry,
};

registerItemType('DISPLAYS', handler);
