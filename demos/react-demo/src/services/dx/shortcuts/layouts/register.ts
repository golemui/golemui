import {
  LayoutWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import { GslLeafSelector } from '../../core/dx.domain';
import { registerItemType, ItemTypeHandler } from '../../core/itemTypeRegistry';
import { LayoutDecorator } from './layouts.domain';

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
  const layoutDef = def as LayoutDecorator;
  return {
    uid: layoutDef.uid ?? '',
    kind: 'layout',
    type: layoutDef.widgetName ?? 'flex',
    props: {
      direction: layoutDef.direction ?? 'vertical',
    },
    children: [],
  } as LayoutWidget<StateKeys, FormData>;
}

function parseEntry(_entry: any): { baseDef: any; path?: string } {
  // Layouts are handled by processLayoutItem, not the generic pipeline.
  // This should never be called.
  throw new Error('Layouts are processed via processLayoutItem, not parseEntry.');
}

const handler: ItemTypeHandler = {
  rollUpSensibleDefaults,
  applySensibleDefaults,
  mapToWidget,
  parseEntry,
};

registerItemType('LAYOUTS', handler);
