// Complexity: COMPOUND — recursive children via buildCustomWidget + getChildren hooks.
// Same pattern as tabs/ and accordion/.
import {
  type FormWidget,
  type FunctionWidgetParams,
  type LayoutWidget,
  type NonFunctionWidget,
  type UiState,
} from '@golemui/core';
import { type MergeResult, type ValidGuiShortcut } from '../../core/dx.domain';
import { type BuildWidgetContext } from '../../core/itemTypeRegistry';
import { defineShortcutType } from '../../core/defineShortcutType';
import { type GslLayoutsConfig, type LayoutDecorator, type LayoutEntry } from './layouts.domain';

function mapToWidget<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
  def: LayoutDecorator,
): NonFunctionWidget<StateKeys, FormData> {
  const {
    uid,
    widgetName,
    tags: _tags,
    size: _size,
    onChange: _onChange,
    include: _include,
    exclude: _exclude,
    ...layoutProps
  } = def;
  const { on: _on, ...cleanLayoutProps } = layoutProps as any;
  return {
    uid: uid ?? '',
    kind: 'layout',
    type: widgetName ?? 'flex',
    props: {
      direction: cleanLayoutProps.direction ?? 'column',
      ...cleanLayoutProps,
    },
    children: [],
  } as LayoutWidget<StateKeys, FormData>;
}

function buildCustomWidget(mergeResult: MergeResult, context: BuildWidgetContext): FormWidget {
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

export const { gsl: _gslLayouts, gslByUid: _gslLayoutByUid } = defineShortcutType<
  LayoutEntry,
  LayoutDecorator,
  GslLayoutsConfig
>({
  itemType: 'LAYOUTS',
  entryShape: 'compound',
  mapToWidget,
  buildCustomWidget,
  getChildren,
});
