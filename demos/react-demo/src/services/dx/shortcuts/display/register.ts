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
import { DisplayDecorator, DisplayEntry, DisplaySensibleDefaultsConfig } from './display.domain';

function rollUpSensibleDefaults(_leafSelectors: GslLeafSelector[]): DisplaySensibleDefaultsConfig {
  return {} as DisplaySensibleDefaultsConfig;
}

function applySensibleDefaults(
  def: DisplayDecorator,
  _config: DisplaySensibleDefaultsConfig,
): DisplayDecorator {
  return def;
}

function mapToWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
>(def: DisplayDecorator): NonFunctionWidget<StateKeys, FormData> {
  return {
    uid: '',
    kind: 'display' as any,
    type: 'renderer',
    props: { render: def.render },
  } as unknown as NonFunctionWidget<StateKeys, FormData>;
}

function parseEntry(entry: DisplayEntry): ParsedEntry<DisplayDecorator> {
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

const handler: ItemTypeHandler<DisplayEntry, DisplayDecorator, DisplaySensibleDefaultsConfig> = {
  rollUpSensibleDefaults,
  applySensibleDefaults,
  mapToWidget,
  parseEntry,
  buildWidget,
};

registerItemType('DISPLAYS', handler);
