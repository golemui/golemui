import type { WidgetLoaders, WithWidget } from '@golemui/core';
import type { ComponentType } from 'react';

// The widget registry caches preloaded components by loader function reference, so the
// loaders handed to preloadFormWidgets in GolemuiProvider and the ones handed to each
// form config must be the very same objects. Keep them here, at module scope, and
// import them in both places (same rule as the Nuxt playground's utils module).
// The explicit annotation keeps the widened component type when these loaders are
// merged with the built-in widgetLoaders (preloadFormWidgets infers from that merge).
export const customWidgetLoaders: WidgetLoaders<ComponentType<WithWidget>, 'heading'> = {
  heading: async () => (await import('./custom-fields/heading/heading.component')).HeadingComponent,
};
