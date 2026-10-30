import { describe, expect, it } from 'vitest';

describe('public exports', () => {
  it('exports these names from the main entry', async () => {
    const entry = await import('./index');

    expect(Object.keys(entry).sort()).toMatchInlineSnapshot(`
      [
        "ActionWidgetAdapter",
        "AngularFormContext",
        "DefaultFormHealthBoundaryComponent",
        "DisplayWidgetAdapter",
        "FormCoreComponent",
        "GOLEMUI_WIDGET_SET",
        "InputWidgetAdapter",
        "LayoutWidgetAdapter",
        "WidgetDirective",
        "WidgetSetFormComponent",
        "provideWidgetSet",
      ]
    `);
  });
});
