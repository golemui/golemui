import {
  type BootstrapContext,
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import {
  BEFORE_APP_SERIALIZED,
  provideServerRendering,
  renderApplication,
} from '@angular/platform-server';
import { DOCUMENT, inject, provideZonelessChangeDetection } from '@angular/core';
import { renderElementsInDocument } from '@golemui/gui-components/ssr';
import { AppComponent } from './app.component';
import './elements';

// Angular renders the gui-* tags empty. Just before the page is serialized, the GolemUI pass
// fills in their content, from their attributes and from the values bound as properties.
const provideGolemuiServerRendering = () => ({
  provide: BEFORE_APP_SERIALIZED,
  multi: true,
  useFactory: () => {
    const document = inject(DOCUMENT);
    return () => renderElementsInDocument(document);
  },
});

// Dev-mode style handling reads the global document for the base href, so the render
// needs a stub with an empty head. It is installed at render time, after the element modules
// loaded: lit takes its browser code path when a document global exists while it loads.
function installDocumentStub() {
  (globalThis as { document?: unknown }).document ??= {
    head: { querySelector: () => null },
    baseURI: 'http://localhost/',
  };
}

/**
 * Renders the page to a string. Called once per request by server.mjs.
 *
 * @param template - The index.html contents. Angular renders into it and returns the
 * whole document, so there is no placeholder replace.
 */
export async function render(template: string): Promise<string> {
  installDocumentStub();
  return renderApplication(
    (context: BootstrapContext) =>
      bootstrapApplication(
        AppComponent,
        {
          providers: [
            provideZonelessChangeDetection(),
            provideServerRendering(),
            provideClientHydration(),
            provideGolemuiServerRendering(),
          ],
        },
        context,
      ),
    { document: template },
  );
}
