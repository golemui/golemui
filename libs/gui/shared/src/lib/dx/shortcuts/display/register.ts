// Complexity: MODERATE — always produces a FunctionWidget (dynamic). The buildCustomWidget
// hook wraps the developer's render function so it re-evaluates on form state changes.
import {
  type FormWidget,
  type FunctionWidgetParams,
  type NonFunctionWidget,
  type UiState,
} from '@golemui/core';
import { type MergeResult } from '@golemui/dx';
import { type BuildWidgetContext } from '@golemui/dx';
import { createShortcutType } from '@golemui/dx';
import { withForm } from '@golemui/dx';
import { type DisplayDecorator, type DisplayEntry, type GslDisplaysConfig } from './display.domain';

function mapToWidget<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
  def: DisplayDecorator,
): NonFunctionWidget<StateKeys, FormData> {
  return {
    uid: '',
    kind: 'display' as const,
    type: 'renderer',
    props: { render: def.render },
  } as unknown as NonFunctionWidget<StateKeys, FormData>;
}

function buildCustomWidget(mergeResult: MergeResult, _context: BuildWidgetContext): FormWidget {
  if (mergeResult.kind === 'static') {
    const displayDef = mergeResult.def as DisplayDecorator;
    return ((params?: FunctionWidgetParams<any>) => ({
      uid: '',
      kind: 'display' as const,
      type: 'renderer',
      ...(displayDef.include != null ? { include: displayDef.include } : {}),
      ...(displayDef.exclude != null ? { exclude: displayDef.exclude } : {}),
      props: { render: displayDef.render(withForm(params)) },
    })) as FormWidget;
  }

  const runtimeFn = mergeResult.fn;
  return ((params?: FunctionWidgetParams<any>) => {
    const displayDef = runtimeFn(params as any);
    return {
      uid: '',
      kind: 'display' as const,
      type: 'renderer',
      ...(displayDef.include != null ? { include: displayDef.include } : {}),
      ...(displayDef.exclude != null ? { exclude: displayDef.exclude } : {}),
      props: { render: displayDef.render(withForm(params)) },
    };
  }) as FormWidget;
}

export const displayShortcutType = createShortcutType<
  DisplayEntry,
  DisplayDecorator,
  GslDisplaysConfig
>({
  itemType: 'DISPLAYS',
  kind: 'display',
  entryShape: 'bare',
  mapToWidget,
  buildCustomWidget,
});

export const _gslDisplays = displayShortcutType.gsl;
export const _gslDisplayByUid = displayShortcutType.gslByUid;
