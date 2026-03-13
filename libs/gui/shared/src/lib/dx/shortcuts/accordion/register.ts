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
import type { AccordionDecorator, AccordionEntry, GslAccordionConfig } from './accordion.domain';

function mapToWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
>(def: AccordionDecorator): NonFunctionWidget<StateKeys, FormData> {
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

function buildWidget(
  mergeResult: MergeResult,
  context: BuildWidgetContext,
): FormWidget {
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

export const { gsl: _gslAccordions, gslById: _gslAccordionById } =
  defineShortcutType<AccordionEntry, AccordionDecorator, GslAccordionConfig>({
    itemType: 'ACCORDION',
    entryShape: 'compound',
    mapToWidget,
    buildWidget,
    getChildren,
  });
