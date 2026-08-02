// Complexity: COMPOUND — recursive children via buildCustomWidget + getChildren hooks.
// Same pattern as tabs/ and layouts/.
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
import type { AccordionDecorator, AccordionEntry, GslAccordionConfig } from './accordion.domain';

function mapToWidget<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
  def: AccordionDecorator,
): NonFunctionWidget<StateKeys, FormData> {
  return {
    uid: def.uid ?? '',
    kind: 'layout',
    type: 'accordion',
    props: {
      sections: def.sections,
      renderMode: def.renderMode ?? 'all',
      ...(def.singleOpen != null ? { singleOpen: def.singleOpen } : {}),
      ...(def.defaultOpen != null ? { defaultOpen: def.defaultOpen } : {}),
    },
    children: [],
  } as LayoutWidget<StateKeys, FormData>;
}

function buildCustomWidget(mergeResult: MergeResult, context: BuildWidgetContext): FormWidget {
  const children = context.walkChildren(context.children ?? []);

  if (mergeResult.kind === 'static') {
    const mapped = context.mapStaticDef(mergeResult.def, 'ACCORDION') as LayoutWidget;
    return { ...mapped, children };
  }

  const fn = mergeResult.fn;
  return ((params: FunctionWidgetParams<any>) => {
    const runtimeDef = fn(params);
    const mapped = context.mapStaticDef(runtimeDef, 'ACCORDION') as LayoutWidget;
    return { ...mapped, children };
  }) as FormWidget;
}

function getChildren(entry: AccordionEntry): any[] | undefined {
  return entry.children;
}

export const accordionShortcutType = createShortcutType<
  AccordionEntry,
  AccordionDecorator,
  GslAccordionConfig
>({
  itemType: 'ACCORDION',
  kind: 'layout',
  entryShape: 'compound',
  mapToWidget,
  buildCustomWidget,
  getChildren,
});

export const _gslAccordions = accordionShortcutType.gsl;
export const _gslAccordionByUid = accordionShortcutType.gslByUid;
