// Complexity: COMPOUND — recursive children via buildCustomWidget + getChildren hooks.
// Study this when your widget contains other widgets. See also accordion/ (same pattern).
import {
  type FormWidget,
  type FunctionWidgetParams,
  type LayoutWidget,
  type NonFunctionWidget,
  type UiState,
} from '@golemui/core';
import type { MergeResult } from '@golemui/dx';
import { type BuildWidgetContext } from '@golemui/dx';
import { createShortcutType } from '@golemui/dx';
import type { GslTabsConfig, TabsDecorator, TabsEntry } from './tabs.domain';

function mapToWidget<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
  def: TabsDecorator,
): NonFunctionWidget<StateKeys, FormData> {
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

function buildCustomWidget(mergeResult: MergeResult, context: BuildWidgetContext): FormWidget {
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

export const tabsShortcutType = createShortcutType<TabsEntry, TabsDecorator, GslTabsConfig>({
  itemType: 'TABS',
  kind: 'layout',
  entryShape: 'compound',
  mapToWidget,
  buildCustomWidget,
  getChildren,
});

export const _gslTabs = tabsShortcutType.gsl;
export const _gslTabsByUid = tabsShortcutType.gslByUid;
