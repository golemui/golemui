// The widget registry caches preloaded components by loader function reference, so the
// loaders handed to preloadFormWidgets in the plugin and the ones handed to each form config
// have to be the very same objects. Keep them here, at module scope, and import them in both.
export const customWidgetLoaders = {
  heading: async () => (await import('~/components/custom-fields/HeadingComponent.vue')).default,
};
