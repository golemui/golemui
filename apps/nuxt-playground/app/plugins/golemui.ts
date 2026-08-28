import { enableDevMode, preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-vue';
import { customWidgetLoaders } from '~/utils/custom-widget-loaders';

export default defineNuxtPlugin({
  name: 'golemui',
  async setup() {
    if (import.meta.client && import.meta.dev) {
      console.log('[GolemUI] DEV mode is enabled');
      enableDevMode();
    }

    // Nuxt awaits this plugin before the first render on either side. The server cannot await
    // a dynamic widget import while producing a string, and the client would otherwise hydrate
    // an empty tree over server markup that is not empty.
    await preloadFormWidgets({ widgetLoaders: { ...widgetLoaders, ...customWidgetLoaders } });
  },
});
