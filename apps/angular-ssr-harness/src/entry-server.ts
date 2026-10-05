import {
  type BootstrapContext,
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-angular';
import { AppComponent } from './app.component';

// Dev-mode style handling reads the global document for the base href, so the render
// needs a stub with an empty head. It is installed after the preload: the lit modules
// use the browser code path when a document global is present while they load. A
// production build removes the dev checks and never reads the stub.
function installDocumentStub() {
  (globalThis as { document?: unknown }).document ??= {
    head: { querySelector: () => null },
    baseURI: 'http://localhost/',
  };
}

/**
 * Renders the harness page to a string. Called once per request by server.mjs.
 *
 * The widgets have to be preloaded before the render, so the server creates every widget
 * synchronously and the markup is complete. The providers are built inside the bootstrap
 * callback: provideServerRendering sets the global server-mode flag at call time, and
 * destroying the platform clears the flag only when the flag was set after the platform
 * was created.
 *
 * @param template - The index.html contents. Angular renders into it and returns the
 * whole document, so there is no placeholder replace.
 */
export async function render(template: string): Promise<string> {
  await preloadFormWidgets({ widgetLoaders });
  installDocumentStub();
  return renderApplication(
    (context: BootstrapContext) =>
      bootstrapApplication(
        AppComponent,
        { providers: [provideServerRendering(), provideClientHydration()] },
        context,
      ),
    { document: template },
  );
}
