import {
  FormWidget,
  FunctionWidgetParams,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import { GslLeafSelector, MergeResult } from '../../core/dx.domain';
import {
  registerItemType,
  ItemTypeHandler,
  ParsedEntry,
  BuildWidgetContext,
} from '../../core/itemTypeRegistry';
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

function parseEntry(entry: any): ParsedEntry {
  return { baseDef: entry };
}

function buildWidget(
  mergeResult: MergeResult,
  _context: BuildWidgetContext,
): FormWidget {
  if (mergeResult.kind === 'static') {
    const displayDef = mergeResult.def as DisplayDecorator;
    return ((params?: FunctionWidgetParams<any>) => ({
      uid: '',
      kind: 'display' as const,
      type: 'renderer',
      props: { render: displayDef.render(params ?? ({} as FunctionWidgetParams<any>)) },
    })) as FormWidget;
  }

  const runtimeFn = mergeResult.fn;
  return ((params?: FunctionWidgetParams<any>) => {
    const displayDef = runtimeFn(params as any);
    return {
      uid: '',
      kind: 'display' as const,
      type: 'renderer',
      props: { render: displayDef.render(params ?? ({} as FunctionWidgetParams<any>)) },
    };
  }) as FormWidget;
}

const handler: ItemTypeHandler = {
  rollUpSensibleDefaults,
  applySensibleDefaults,
  mapToWidget,
  parseEntry,
  buildWidget,
};

registerItemType('DISPLAYS', handler);
