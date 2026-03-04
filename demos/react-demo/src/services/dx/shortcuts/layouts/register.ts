import {
  FormWidget,
  FunctionWidgetParams,
  LayoutWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import { GslLeafSelector, MergeResult, ValidGuiShortcut } from '../../core/dx.domain';
import {
  registerItemType,
  ItemTypeHandler,
  ParsedEntry,
  BuildWidgetContext,
} from '../../core/itemTypeRegistry';
import { LayoutDecorator, LayoutEntry } from './layouts.domain';

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

function parseEntry(entry: any): ParsedEntry {
  const layoutEntry = entry as LayoutEntry;
  return {
    baseDef: layoutEntry.def,
    children: layoutEntry.children,
  };
}

function buildWidget(
  mergeResult: MergeResult,
  context: BuildWidgetContext,
): FormWidget {
  const children = context.walkChildren(context.children ?? []);

  if (mergeResult.kind === 'static') {
    const mapped = context.mapStaticDef(mergeResult.def, 'LAYOUTS') as LayoutWidget;
    return { ...mapped, children };
  }

  const fn = mergeResult.fn;
  return ((params: FunctionWidgetParams<any>) => {
    const runtimeDef = fn(params);
    const mapped = context.mapStaticDef(runtimeDef, 'LAYOUTS') as LayoutWidget;
    return { ...mapped, children };
  }) as FormWidget;
}

function getChildren(entry: any): ValidGuiShortcut[] | undefined {
  return (entry as LayoutEntry).children;
}

const handler: ItemTypeHandler = {
  rollUpSensibleDefaults,
  applySensibleDefaults,
  mapToWidget,
  parseEntry,
  buildWidget,
  getChildren,
};

registerItemType('LAYOUTS', handler);
