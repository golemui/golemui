// Complexity: MODERATE — always produces a FunctionWidget (dynamic). The buildCustomWidget
// hook wraps the developer's render function so it re-evaluates on form state changes.
import {
  FormWidget,
  FunctionWidgetParams,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import { MergeResult } from '../../core/dx.domain';
import { BuildWidgetContext } from '../../core/itemTypeRegistry';
import { defineShortcutType } from '../../core/defineShortcutType';
import { DisplayDecorator, DisplayEntry, GslDisplaysConfig } from './display.domain';

function mapToWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
>(def: DisplayDecorator): NonFunctionWidget<StateKeys, FormData> {
  return {
    uid: '',
    kind: 'display' as const,
    type: 'renderer',
    props: { render: def.render },
  } as unknown as NonFunctionWidget<StateKeys, FormData>;
}

function buildCustomWidget(
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

export const { gsl: _gslDisplays, gslById: _gslDisplayById } =
  defineShortcutType<DisplayEntry, DisplayDecorator, GslDisplaysConfig>({
    itemType: 'DISPLAYS',
    entryShape: 'bare',
    mapToWidget,
    buildCustomWidget,
  });
