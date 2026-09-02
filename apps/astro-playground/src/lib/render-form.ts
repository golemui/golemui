import { preloadFormWidgets } from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import type { FormHealthBoundary } from '@golemui/lit';
import { renderGuiHtml } from '@golemui/lit/ssr';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { allWidgetLoaders } from './widget-loaders';
import '@golemui/gui-lit';

/**
 * Server side of a playground page: renders one `<gui-form>` to a string, widget internals
 * included. Called from the page frontmatter, so it runs per request (or once at build time
 * for a prerendered page). Only ever imported from frontmatter: `@golemui/lit/ssr` pulls in
 * @lit-labs/ssr, which has no browser build.
 *
 * The widgets are preloaded first because the render is synchronous: it cannot await a
 * widget's dynamic import while producing the string. The registry caches by loader
 * identity, so after the first request the preload resolves immediately.
 */
export async function renderForm(
  config: GuiFormInitConfig,
  options: { autocomplete?: string; formHealthBoundary?: FormHealthBoundary } = {},
): Promise<string> {
  await preloadFormWidgets({ widgetLoaders: allWidgetLoaders });
  return renderGuiHtml(html`
    <gui-form
      .config=${config}
      autocomplete=${ifDefined(options.autocomplete)}
      .formHealthBoundary=${options.formHealthBoundary}
    ></gui-form>
  `);
}
