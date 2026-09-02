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
    // Zoneless, like apps/angular-ssr-harness: the widget adapters are signal-based, and
    // loading zone.js into the Vite dev server breaks sass-embedded (see main.server.ts).
    provideZonelessChangeDetection(),
    provideFileRouter(),
    // Shared with the server config: hydration needs the same providers on both sides.
    provideClientHydration(),
  ],
};
