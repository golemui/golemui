import { bootstrapApplication } from '@angular/platform-browser';
import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-angular';
import { App } from './app/app';
import { appConfig } from './app/app.config';

// Preload the widgets before bootstrapping: hydration then creates every widget
// synchronously and reuses the server-rendered DOM instead of re-rendering it.
preloadFormWidgets({ widgetLoaders }).then(() => {
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
});
