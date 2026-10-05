import { renderElementsInHtml } from '@golemui/gui-components/ssr';

// Nuxt renders the gui-* tags with their attributes but empty: fill in their content before the
// page is sent.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    html.body = html.body.map(renderElementsInHtml);
  });
});
