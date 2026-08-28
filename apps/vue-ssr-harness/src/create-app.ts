import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-vue';
import { createSSRApp, type App } from 'vue';
import Root from './App.vue';

/**
 * Builds the app for the server entry and the client entry.
 *
 * The preload has to finish before the first render on either side. The server cannot
 * await a dynamic import while producing a string, and the client would otherwise render
 * an empty tree over server markup that is not empty.
 */
export async function createHarnessApp(): Promise<App> {
  await preloadFormWidgets({ widgetLoaders });
  return createSSRApp(Root);
}
