import { bootstrapApplication } from '@angular/platform-browser';
import { enableDevMode, preloadFormWidgets } from '@golemui/core';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { allWidgetLoaders } from './app/widget-loaders';

if (import.meta.env.DEV) {
  console.log('[GolemUI] DEV mode is enabled');
  enableDevMode();
}

// The preload has to finish before the bootstrap, so hydration creates every widget
// synchronously and reuses the server DOM (same as apps/angular-ssr-harness/src/entry-client.ts).
preloadFormWidgets({ widgetLoaders: allWidgetLoaders }).then(() => {
  bootstrapApplication(App, appConfig).catch((error) => console.error(error));
});
