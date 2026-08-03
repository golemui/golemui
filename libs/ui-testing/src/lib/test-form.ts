import type { Form, LayoutWidget, ReactiveExpression } from '@golemui/core';

/**
 * Builds a test form definition: wraps the given widgets in a root vertical
 * layout using the reserved `flex` type every widget set implementation must
 * provide. Runtime-identical to the gui builder helper the suites previously
 * imported from gui-shared, but without gui-specific widget typing, so the
 * suites stay free of implementation imports.
 *
 * @param config - The named state expressions and the widget list.
 * @returns A form definition ready to pass to a mount fixture.
 */
export function testForm(config: {
  states?: Record<string, ReactiveExpression>;
  form: any[];
}): Form<any> {
  return {
    states: config.states,
    form: {
      uid: 'gui-root-uid',
      type: 'flex',
      kind: 'layout',
      children: config.form,
    } as LayoutWidget<any>,
  };
}
