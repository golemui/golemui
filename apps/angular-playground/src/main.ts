import { bootstrapApplication } from '@angular/platform-browser';
import { enableDevMode } from '@golemui/core';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

if (environment.env !== 'prod') {
  console.log('[GolemUI] DEV mode is enabled');
  enableDevMode();
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
