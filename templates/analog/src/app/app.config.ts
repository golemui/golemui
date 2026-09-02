import { provideFileRouter } from '@analogjs/router';
import {
  type ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideFileRouter(),
    // Shared with app.config.server.ts: hydration needs the same providers on both sides.
    provideClientHydration(),
  ],
};
