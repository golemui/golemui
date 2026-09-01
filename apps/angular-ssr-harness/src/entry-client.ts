import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-angular';
import { AppComponent } from './app.component';

// The preload has to finish before the bootstrap, so hydration creates every widget
// synchronously and reuses the server DOM. styles.scss is linked from index.html, so the
// page is styled with JavaScript disabled.
preloadFormWidgets({ widgetLoaders }).then(() => {
  bootstrapApplication(AppComponent, {
    providers: [provideClientHydration()],
  }).catch((error) => console.error(error));
});
