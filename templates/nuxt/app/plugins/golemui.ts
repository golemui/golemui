import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-vue';

// Nuxt awaits this plugin before the first render, on the server and on the client. A server
// render cannot wait for a widget's dynamic import while it produces the page, and the client
// would otherwise hydrate an empty tree over markup that is not empty.
//
// Custom widgets: keep their loaders in one module-scope object, spread it into the call below
// and pass the same object as `customWidgetLoaders` in every form config. The registry caches
// preloaded components by loader function identity.
export default defineNuxtPlugin(async () => {
  await preloadFormWidgets({ widgetLoaders });
});
