import { describe, expect, it } from 'vitest';

describe('public exports', () => {
  it('exports these names from the main entry', async () => {
    const entry = await import('./index');

    expect(Object.keys(entry).sort()).toMatchInlineSnapshot(`
      [
        "ActionWidgetAdapter",
        "BaseWidgetAdapter",
        "DisplayWidgetAdapter",
        "FormElement",
        "InputWidgetAdapter",
        "LayoutWidgetAdapter",
        "LitFormContext",
        "WidgetElement",
        "actionContext",
        "createFormComponent",
        "defaultFormHealthBoundary",
        "displayWidgetContext",
        "formContext",
        "inputContext",
        "layoutContext",
        "resumeServerRenderedForm",
        "safeDefine",
      ]
    `);
  });

  it('exports these names from the internals entry', async () => {
    const entry = await import('./internals');

    expect(Object.keys(entry).sort()).toMatchInlineSnapshot(`
      [
        "cspStyleMap",
        "safeDefine",
        "tagNameOf",
        "unsubscribeAll",
      ]
    `);
  });

  it('exports these names from the ssr entry', async () => {
    const entry = await import('./ssr');

    expect(Object.keys(entry).sort()).toMatchInlineSnapshot(`
      [
        "RegisteredElementRenderer",
        "cleanServerMarkup",
        "installLitSsrSupport",
        "renderForm",
        "renderTemplate",
      ]
    `);
  });
});
