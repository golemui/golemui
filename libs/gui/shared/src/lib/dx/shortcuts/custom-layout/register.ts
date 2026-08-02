import { type FormWidget, type FunctionWidgetParams, type LayoutWidget } from '@golemui/core';
import { type MergeResult, type ValidGuiShortcut } from '@golemui/dx';
import { type BuildWidgetContext } from '@golemui/dx';
import { createShortcutType } from '@golemui/dx';
import type {
  CustomLayoutDecorator,
  CustomLayoutEntry,
  GslCustomLayoutConfig,
} from './customLayout.domain';

function mapToWidget(def: CustomLayoutDecorator) {
  return {
    uid: def.uid ?? '',
    kind: 'layout' as const,
    type: def.customType,
    props: def.props ?? {},
    children: [],
  } as LayoutWidget;
}

function buildCustomWidget(mergeResult: MergeResult, context: BuildWidgetContext): FormWidget {
  const children = context.walkChildren(context.children ?? []);

  if (mergeResult.kind === 'static') {
    const mapped = context.mapStaticDef(mergeResult.def, 'CUSTOM_LAYOUT') as LayoutWidget;
    return { ...mapped, children };
  }

  const fn = mergeResult.fn;
  return ((params: FunctionWidgetParams<any>) => {
    const runtimeDef = fn(params);
    const mapped = context.mapStaticDef(runtimeDef, 'CUSTOM_LAYOUT') as LayoutWidget;
    return { ...mapped, children };
  }) as FormWidget;
}

function getChildren(entry: CustomLayoutEntry): ValidGuiShortcut[] | undefined {
  return entry.children;
}

export const customLayoutShortcutType = createShortcutType<
  CustomLayoutEntry,
  CustomLayoutDecorator,
  GslCustomLayoutConfig
>({
  itemType: 'CUSTOM_LAYOUT',
  kind: 'layout',
  entryShape: 'compound',
  mapToWidget,
  buildCustomWidget,
  getChildren,
});

export const _gslCustomLayouts = customLayoutShortcutType.gsl;
export const _gslCustomLayoutByUid = customLayoutShortcutType.gslByUid;
