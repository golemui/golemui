import type { Type } from '@angular/core';
import type { WidgetLoaders, WithWidget } from '@golemui/core';

// The widget registry caches preloaded components by loader function reference, so the
// loaders handed to preloadFormWidgets in main.ts / main.server.ts and the ones handed to
// each form config must be the very same objects. Keep them here, at module scope, and
// import them in both places (same rule as the Next.js and Nuxt playgrounds).
// The explicit annotation keeps the widened component type when these loaders are
// merged with the built-in widgetLoaders (preloadFormWidgets infers from that merge).
export const customWidgetLoaders: WidgetLoaders<Type<WithWidget>, 'heading'> = {
  heading: async () =>
    (await import('./custom-widgets/heading/heading.component')).HeadingComponent,
};
