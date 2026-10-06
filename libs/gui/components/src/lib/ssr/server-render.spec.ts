import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { renderTemplate } from '../../ssr';
import { serverTemplate } from './ssr.fixture';

/**
 * Server-markup spec: renders standalone elements, with no form engine, to a string in plain
 * Node (no DOM globals beyond the lit shim). The markup is kept in goldens/server-markup.html,
 * which the resume spec loads into a DOM. Run vitest with `-u` to update it after a template
 * change.
 */

describe('server rendering standalone elements in plain node', () => {
  let markup = '';

  beforeAll(async () => {
    markup = await renderTemplate(serverTemplate());
  });

  // Without the trailing spaces lit leaves on blank lines, which an editor trims on save
  // (.editorconfig); they are not part of what the spec checks.
  it('matches the golden markup the resume spec hydrates from', async () => {
    await expect(markup.replace(/[ \t]+$/gm, '')).toMatchFileSnapshot(
      join(__dirname, 'goldens/server-markup.html'),
    );
  });

  it('renders the content of the elements that render their own', () => {
    expect(markup).toMatch(/<label[^>]*for="email"/);
    expect(markup).toMatch(/<input[^>]*id="email"[^>]*value="ada@example.com"/);
    // The element validates itself: a native constraint would make the browser validate again.
    expect(markup).not.toMatch(/<input[^>]*id="email"[^>]*\srequired/);
    expect(markup).toMatch(/<option\s+value="team"\s+selected/);
    expect(markup).toMatch(/<input[^>]*type="checkbox"[^>]*id="terms"[^>]*checked/);
  });

  it("keeps the app's children of the elements that enhance them", () => {
    expect(markup).toMatch(/<gui-alert[^>]*>Yearly billing saves two months.<\/gui-alert>/);
    expect(markup).toMatch(/<gui-tab [^>]*>Billing<\/gui-tab>/);
    expect(markup).toMatch(/<gui-tab-panel[^>]*>\s*<gui-select/);
  });

  it('holds every GolemUI element inert through defer-hydration', () => {
    const tags = [...markup.matchAll(/<(gui-[a-z-]+)([^>]*)>/g)];
    expect(tags.length).toBe(8);
    for (const [, tag, attributes] of tags) {
      expect(attributes, tag).toContain('defer-hydration');
    }
  });

  it('emits light DOM only: no shadow root wrappers and no marker comments', () => {
    expect(markup).not.toContain('<template');
    expect(markup).not.toContain('lit-part');
    expect(markup).not.toContain('lit-node');
  });
});
