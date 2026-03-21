import {
  FormWidget,
  FunctionWidgetParams,
  LayoutWidget,
  NonFunctionWidget,
} from '@golemui/core';
import { DxDefinitions } from '../formDef.domain';
import { FormConfig, GslSelectorsInput } from '../core/dx.domain';
import { formDefs } from '../dx.service';

/**
 * Process a form definition through the full DX pipeline.
 *
 * Returns the root layout widget with its children.
 * Strips the auto-injected submit button for cleaner assertions
 * (it's always the last child if present).
 *
 * IMPORTANT: Asserts that the root widget IS a layout with uid '#root'
 * before unwrapping. This makes the helper a canary for auto-stack
 * changes — if Phase 2 subtly alters auto-stack wiring, this assertion
 * fails loudly instead of silently masking a regression.
 */
export function processDx(
  defs: DxDefinitions,
  selectors?: GslSelectorsInput,
  formConfig?: FormConfig,
): LayoutWidget {
  const { form } = formDefs.processDxFacade(defs, selectors, formConfig);
  const root = form.form as LayoutWidget;

  // Canary: verify the auto-stack produced the expected root
  if (root.kind !== 'layout' || root.uid !== '#root') {
    throw new Error(
      `Expected root layout with uid '#root', got kind='${root.kind}' uid='${root.uid}'. ` +
        `Auto-stack behavior may have changed.`,
    );
  }

  // Strip auto-injected submit button (last child with uid '#submit')
  const children = [...(root.children ?? [])];
  const lastChild = children[children.length - 1];
  if (
    lastChild &&
    typeof lastChild !== 'function' &&
    (lastChild as NonFunctionWidget & { uid?: string }).uid === '#submit'
  ) {
    children.pop();
  }

  return { ...root, children };
}

/**
 * Get a static (non-function) child widget from a layout by index.
 * Throws if the child is a function widget — use resolveDynamic for those.
 */
export function getStaticChild(layout: LayoutWidget, index: number): NonFunctionWidget {
  const child = layout.children?.[index];
  if (child == null) {
    throw new Error(
      `No child at index ${index}. Layout has ${layout.children?.length ?? 0} children.`,
    );
  }
  if (typeof child === 'function') {
    throw new Error(`Child at index ${index} is a function widget. Use resolveDynamic() instead.`);
  }
  return child as NonFunctionWidget;
}

/**
 * Get a raw child from a layout by index (could be static or function).
 */
export function getRawChild(layout: LayoutWidget, index: number): FormWidget {
  const child = layout.children?.[index];
  if (child == null) {
    throw new Error(
      `No child at index ${index}. Layout has ${layout.children?.length ?? 0} children.`,
    );
  }
  return child;
}

/**
 * Resolve a function widget (dynamic) by calling it with given params.
 * Returns the resolved static widget.
 */
export function resolveDynamic(
  widget: FormWidget,
  params?: Partial<FunctionWidgetParams<any>>,
): NonFunctionWidget {
  if (typeof widget !== 'function') {
    throw new Error('Widget is not a function widget. Use getStaticChild() instead.');
  }
  return widget((params ?? {}) as FunctionWidgetParams<any>) as NonFunctionWidget;
}
