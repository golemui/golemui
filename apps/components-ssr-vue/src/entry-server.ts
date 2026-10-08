import { renderElementsInHtml } from '@golemui/gui-components/ssr';
import { renderToString } from 'vue/server-renderer';
import { createPageApp } from './create-app';

/**
 * Renders the page to a string. Called once per request by server.mjs.
 *
 * Vue renders the gui-* tags with their attributes but empty, so the GolemUI pass fills in
 * their content.
 */
export async function render(): Promise<string> {
  return renderElementsInHtml(await renderToString(createPageApp()));
}
