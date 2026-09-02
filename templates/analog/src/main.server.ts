import '@angular/platform-server/init';
import { render } from '@analogjs/router/server';
import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-angular';
import { App } from './app/app';
import { config } from './app/app.config.server';

// Preload the widgets once per server process. The form then creates every widget
// synchronously during the render, so the server markup is complete.
const widgetsReady = preloadFormWidgets({ widgetLoaders });

const renderPage = render(App, config);

// Analog calls the default export for every page request and for each prerendered route.
export default async function renderWithWidgets(
  ...args: Parameters<typeof renderPage>
): ReturnType<typeof renderPage> {
  await widgetsReady;
  return renderPage(...args);
}
