import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-lit';
import { renderGuiHtml } from '@golemui/lit/ssr';
import { html } from 'lit';
import { config } from './form-config';

/**
 * Renders the harness page to a string. Called once per request by server.mjs.
 *
 * The widgets have to be preloaded before the render, because the server cannot await a
 * dynamic import while producing a string. The heading and the status text are part of
 * the same lit template, so the whole page comes from one server render, as in the Vue
 * and React harnesses.
 */
export async function render(): Promise<string> {
  await preloadFormWidgets({ widgetLoaders });
  return renderGuiHtml(html`
    <div class="harness">
      <h1 class="harness__title">Lit server rendering harness</h1>
      <p class="harness__status" data-resumed="false">Server HTML, not yet resumed</p>
      <p class="harness__note">
        The whole form is server rendered, widget internals included: inputs, labels and values are
        in the HTML. The client does not hydrate that markup, it replaces it with one live render.
        View source to see the server output.
      </p>
      <gui-form .config=${config}></gui-form>
    </div>
  `);
}
