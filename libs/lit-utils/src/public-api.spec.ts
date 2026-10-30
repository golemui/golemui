import { describe, expect, it } from 'vitest';

describe('public exports', () => {
  it('exports these names from the main entry', async () => {
    const entry = await import('./index');

    expect(Object.keys(entry).sort()).toMatchInlineSnapshot(`
      [
        "SERVER_RENDERED_ATTRIBUTE",
        "cspStyleMap",
        "onElementRegistered",
        "rendersIntoLightDom",
        "resumeServerRendered",
        "safeDefine",
        "serverElementRenderer",
        "serverRenderedClass",
        "tagNameOf",
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
        "renderElement",
        "renderElementsInDocument",
        "renderElementsInHtml",
        "renderTemplate",
      ]
    `);
  });
});
