// @vitest-environment node
import { Component } from '@angular/core';
import {
  type BootstrapContext,
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { preloadFormWidgets } from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import { beforeAll, describe, expect, it } from 'vitest';
import { FormComponent } from './components/form/form.component';
import { widgetLoaders } from './widget.loaders';

/**
 * Server-markup spec against the real widget set: the stub spec in the adapter package
 * proves the mechanism, this one proves the shipped components render on the server. The
 * tabs layout is native Angular and reaches browser APIs from both server-executed
 * lifecycle hooks, so this spec fails if either platform guard is removed.
 */

// Dev-mode style handling reads the global document for the base href, so the render
// needs a stub with an empty head. It must not exist while the lit modules load: their
// node builds use the browser code path when a document global is present.
function installDocumentStub() {
  (globalThis as { document?: unknown }).document ??= {
    head: { querySelector: () => null },
    baseURI: 'http://localhost/',
  };
}

const config: GuiFormInitConfig = {
  formName: 'gui-angular-ssr-form',
  formDef: {
    form: {
      uid: 'root',
      kind: 'layout',
      type: 'tabs',
      props: {
        defaultOpen: 'tab1',
        tabs: [
          { uid: 'tab1', label: 'Account' },
          { uid: 'tab2', label: 'Details' },
        ],
      },
      children: [
        { uid: 'tab1', kind: 'input', type: 'textinput', path: 'firstName', label: 'First name' },
        { uid: 'tab2', kind: 'input', type: 'textinput', path: 'lastName', label: 'Last name' },
      ],
    },
  },
  data: { firstName: 'Ada', lastName: 'Lovelace' },
};

@Component({
  standalone: true,
  selector: 'gui-ssr-host',
  imports: [FormComponent],
  template: `<gui-form [config]="config" />`,
})
class SsrHostComponent {
  config = config;
}

const hostDocument = '<html><head></head><body><gui-ssr-host></gui-ssr-host></body></html>';

// The providers are built inside the bootstrap callback: provideServerRendering sets the
// global server-mode flag at call time, and destroying the platform clears the flag only
// when the flag was set after the platform was created.
const renderForm = () =>
  renderApplication(
    (context: BootstrapContext) =>
      bootstrapApplication(
        SsrHostComponent,
        { providers: [provideServerRendering(), provideClientHydration()] },
        context,
      ),
    { document: hostDocument },
  );

describe('server rendering the gui widget set in plain node', () => {
  let markup = '';

  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders });
    installDocumentStub();
    markup = await renderForm();
  }, 30_000);

  it('renders the form with its name and no placeholder or error text', () => {
    expect(markup).toMatch(/<form [^>]*id="gui-angular-ssr-form"/);
    expect(markup).not.toContain('Loading form...');
    expect(markup).not.toContain('gui-form-health-error');
  });

  it('renders the tabs layout, whose browser API usage is platform-guarded', () => {
    expect(markup).toMatch(/<gui-tabs-layout[^>]*class="[^"]*gui-tabs/);
    expect(markup).toContain('Account');
    expect(markup).toContain('Details');
  });

  it('keeps the custom elements inert until the client removes the attribute', () => {
    expect(markup).toMatch(/<gui-textinput[^>]*defer-hydration=""/);
  });

  it('is deterministic across renders', async () => {
    const second = await renderForm();

    expect(second).toBe(markup);
  });
});
