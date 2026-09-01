import type { WidgetLoaders, WithWidget } from '@golemui/core';
import type { Type } from '@golemui/lit';

// The widget registry caches preloaded components by loader function reference, so the
// loaders preloaded before a render (server or client) and the ones handed to each form
// config must be the very same objects. Keep them here, at module scope, and import them
// in both places (same rule as the Nuxt and Next.js playgrounds).
export const customWidgetLoaders: WidgetLoaders<Type<WithWidget>, 'heading'> = {
  heading: async () => (await import('../custom-widgets/heading/heading.element')).HeadingElement,
};
