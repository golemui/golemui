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
    // The slider's value shows in its label, and its range input carries its bounds.
    expect(markup).toMatch(/<output class="gui-slider__value"[^>]*>12<\/output>/);
    expect(markup).toMatch(/<input[^>]*type="range"[^>]*id="seats"[^>]*max="50"/);
  });

  it("keeps the app's children of the elements that enhance them", () => {
    expect(markup).toMatch(/<gui-alert[^>]*>Yearly billing saves two months.<\/gui-alert>/);
    expect(markup).toMatch(/<gui-tab [^>]*>Billing<\/gui-tab>/);
    expect(markup).toMatch(/<gui-tab-panel[^>]*>\s*<gui-select/);
    expect(markup).toMatch(
      /<gui-popover[^>]*>\s*<div id="plan-help" popover>Every plan includes email support.<\/div>/,
    );
    expect(markup).toMatch(/<gui-tooltip\s+for="plan-help-button"[^>]*>Opens the plan details</);
    expect(markup).toMatch(/<gui-menu[^>]*>\s*<div id="plan-actions" popover>\s*<button/);
    // A closed dialog, with the fields inside it rendered too.
    expect(markup).toMatch(/<gui-dialog[^>]*>\s*<dialog id="plan-dialog"[^>]*>\s*<h2/);
    expect(markup).not.toMatch(/<dialog[^>]*\sopen/);
    expect(markup).toMatch(/<input[^>]*id="coupon"/);
    // An empty toaster: its region is created in the browser.
    expect(markup).toMatch(/<gui-toaster[^>]*placement="top-end"[^>]*><\/gui-toaster>/);
  });

  it('holds every GolemUI element inert through defer-hydration', () => {
    const tags = [...markup.matchAll(/<(gui-[a-z-]+)([^>]*)>/g)];
    expect(tags.length).toBe(15);
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
