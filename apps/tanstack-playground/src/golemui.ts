import { enableDevMode, preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-react';
import { customWidgetLoaders } from './components/custom-widget-loaders';

// Widgets load through dynamic import(), and a server render cannot wait for one. One promise
// per module graph: server.ts awaits it before each request is rendered, client.tsx before
// hydrateRoot, so the browser hydrates the same tree the server sent (the TanStack Start
// equivalent of the Next.js playground's GolemuiProvider and the Nuxt golemui plugin).
export const golemuiReady = preloadFormWidgets({
  widgetLoaders: { ...widgetLoaders, ...customWidgetLoaders },
});

// Module scope, so dev mode is on before the first form is processed.
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('[GolemUI] DEV mode is enabled');
  enableDevMode();
}
