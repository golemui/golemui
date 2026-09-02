import '@angular/platform-server/init';
import { render } from '@analogjs/router/server';
import { preloadFormWidgets } from '@golemui/core';
import { App } from './app/app';
import { config } from './app/app.config.server';
import { allWidgetLoaders } from './app/widget-loaders';

// Zoneless on purpose (see app.config.ts): Analog evaluates this module inside the Vite dev
// server process, and `zone.js/node` would replace the global Promise there. sass-embedded
// detects async importer results with `instanceof Promise`, so with zone.js loaded every
// stylesheet request fails with `The importer must return an absolute URL, was
// "[object Promise]"`.

// The widgets are preloaded at module scope, before any document stub exists: the lit
// modules use the browser code path when a document global is present while they load.
// platform-server/init only installs the DOM classes, not a document instance, so the
// preload resolves the node builds (see apps/angular-ssr-harness/src/entry-server.ts).
const widgetsReady = preloadFormWidgets({ widgetLoaders: allWidgetLoaders });

const renderPage = render(App, config);

/**
 * Analog calls the default export with (url, template, serverContext) for every page: in
 * the dev server, in the Nitro request renderer and in the build-time prerender pass. The
 * widgets have to be preloaded before the render, so the server creates every widget
 * synchronously and the markup is complete.
 */
export default async function renderWithWidgets(
  ...args: Parameters<typeof renderPage>
): ReturnType<typeof renderPage> {
  await widgetsReady;
  return renderPage(...args);
}
