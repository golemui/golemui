import {
  FormWidget,
  FunctionWidgetParams,
  LayoutWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import type { MergeResult } from '../../core/dx.domain';
import { BuildWidgetContext } from '../../core/itemTypeRegistry';
import { defineShortcutType } from '../../core/defineShortcutType';
import type { GslTabsConfig, TabsDecorator, TabsEntry } from './tabs.domain';

function mapToWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
>(def: TabsDecorator): NonFunctionWidget<StateKeys, FormData> {
  return {
    uid: def.uid ?? '',
    kind: 'layout',
    type: 'tabs',
    props: {
      tabs: def.tabs,
      renderMode: def.renderMode ?? 'all',
      ...(def.defaultOpen != null ? { defaultOpen: def.defaultOpen } : {}),
    },
    children: [],
  } as LayoutWidget<StateKeys, FormData>;
}

function buildCustomWidget(
  mergeResult: MergeResult,
  context: BuildWidgetContext,
): FormWidget {
  const children = context.walkChildren(context.children ?? []);

  if (mergeResult.kind === 'static') {
    const mapped = context.mapStaticDef(mergeResult.def, 'TABS') as LayoutWidget;
    return { ...mapped, children };
  }

  const fn = mergeResult.fn;
  return ((params: FunctionWidgetParams<any>) => {
    const runtimeDef = fn(params);
    const mapped = context.mapStaticDef(runtimeDef, 'TABS') as LayoutWidget;
    return { ...mapped, children };
  }) as FormWidget;
}

function getChildren(entry: TabsEntry): any[] | undefined {
  return entry.children;
}

export const { gsl: _gslTabs, gslById: _gslTabsById } =
  defineShortcutType<TabsEntry, TabsDecorator, GslTabsConfig>({
    itemType: 'TABS',
    entryShape: 'compound',
    mapToWidget,
    buildCustomWidget,
    getChildren,
  });
