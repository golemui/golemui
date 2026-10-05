// The Nitro plugin the Nuxt module (nuxt.ts) registers: Nuxt renders the elements' tags with their
// attributes but empty, and this fills in their content before the page is sent.
import { renderElementsInHtml } from './ssr';

/** The part of the Nitro app the plugin uses: the hook Nuxt calls with each rendered page. */
interface NitroApp {
  hooks: {
    hook(name: 'render:html', handler: (html: { body: string[] }) => void): void;
  };
}

// A Nitro plugin is a plain function: `defineNitroPlugin` only types it.
export default function golemuiServerRendering(nitroApp: NitroApp): void {
  nitroApp.hooks.hook('render:html', (html) => {
    html.body = html.body.map(renderElementsInHtml);
  });
}
