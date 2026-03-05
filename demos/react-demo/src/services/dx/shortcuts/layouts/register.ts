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
import { LayoutDecorator, LayoutEntry, LayoutSensibleDefaultsConfig } from './layouts.domain';

function rollUpSensibleDefaults(_leafSelectors: GslLeafSelector[]): LayoutSensibleDefaultsConfig {
  return {} as LayoutSensibleDefaultsConfig;
}

function applySensibleDefaults(
  def: LayoutDecorator,
  _config: LayoutSensibleDefaultsConfig,
): LayoutDecorator {
  return def;
}

function mapToWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
>(def: LayoutDecorator): NonFunctionWidget<StateKeys, FormData> {
  return {
    uid: def.uid ?? '',
    kind: 'layout',
    type: def.widgetName ?? 'flex',
    props: {
      direction: def.direction ?? 'vertical',
      ...def.props,
    },
    children: [],
  } as LayoutWidget<StateKeys, FormData>;
}

function parseEntry(entry: LayoutEntry): ParsedEntry<LayoutDecorator> {
  return {
    baseDef: entry.def,
    children: entry.children,
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

function getChildren(entry: LayoutEntry): ValidGuiShortcut[] | undefined {
  return entry.children;
}

const handler: ItemTypeHandler<LayoutEntry, LayoutDecorator, LayoutSensibleDefaultsConfig> = {
  rollUpSensibleDefaults,
  applySensibleDefaults,
  mapToWidget,
  parseEntry,
  buildWidget,
  getChildren,
};

registerItemType('LAYOUTS', handler);
