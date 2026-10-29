import { describe, expect, it } from 'vitest';

describe('public exports', () => {
  it('exports these names from the main entry', async () => {
    const entry = await import('./index');

    expect(Object.keys(entry).sort()).toMatchInlineSnapshot(`
      [
        "DefaultFormHealthBoundary",
        "FormComponent",
        "VueFormContext",
        "WidgetErrorBoundary",
        "WidgetRenderer",
        "createFormComponent",
        "formContextInjectionKey",
        "provideFormContext",
        "useActionWidget",
        "useDebounceCallback",
        "useDisplayWidget",
        "useInputWidget",
        "useItemRenderer",
        "useLayoutWidget",
        "useVueFormContext",
      ]
    `);
  });
});
