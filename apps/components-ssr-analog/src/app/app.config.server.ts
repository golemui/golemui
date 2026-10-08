import { type ApplicationConfig, DOCUMENT, inject, mergeApplicationConfig } from '@angular/core';
import { BEFORE_APP_SERIALIZED, provideServerRendering } from '@angular/platform-server';
import { renderElementsInDocument } from '@golemui/gui-components/ssr';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    // Angular renders the gui-* tags empty. Just before the page is serialized, the GolemUI pass
    // fills in their content, from their attributes and from the values bound as properties.
    {
      provide: BEFORE_APP_SERIALIZED,
      multi: true,
      useFactory: () => {
        const document = inject(DOCUMENT);
        return () => renderElementsInDocument(document);
      },
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
