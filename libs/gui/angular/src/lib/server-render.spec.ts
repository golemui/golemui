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
        {
          uid: 'tab1',
          kind: 'layout',
          type: 'flex',
          children: [
            { kind: 'input', type: 'textinput', path: 'firstName', label: 'First name' },
            // The upload widgets read their service on their first update, so they must stay
            // inert until the client has bound `dependencies` (see the defer-hydration test).
            { kind: 'input', type: 'fileUpload', path: 'avatar', label: 'Avatar' },
            { kind: 'input', type: 'multiFileUpload', path: 'documents', label: 'Documents' },
          ],
        },
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
    expect(markup).toMatch(/<gui-file-upload[^>]*defer-hydration=""/);
    expect(markup).toMatch(/<gui-multi-file-upload[^>]*defer-hydration=""/);
  });

  it('marks every rendered custom element, not only the ones this spec names', () => {
    // Angular hosts wrap each widget as gui-<type>-{control,interactive,display,layout}; the
    // form shell has its own hosts. Everything else with a gui- prefix is a lit element that
    // would upgrade before its bindings arrive if the attribute were missing.
    const hostTags = new Set([
      'gui-ssr-host',
      'gui-form',
      'gui-widget-set-form',
      'gui-core-form',
      'gui-default-form-health-boundary',
    ]);
    const customElements = [...markup.matchAll(/<(gui-[a-z-]+)([^>]*)>/g)].filter(
      ([, tag]) => !hostTags.has(tag) && !/-(control|interactive|display|layout)$/.test(tag),
    );

    expect(customElements.map(([, tag]) => tag)).toEqual(
      expect.arrayContaining(['gui-textinput', 'gui-file-upload', 'gui-multi-file-upload']),
    );
    for (const [, tag, attributes] of customElements) {
      expect(attributes, tag).toContain('defer-hydration=""');
    }
  });

  it('is deterministic across renders', async () => {
    const second = await renderForm();

    expect(second).toBe(markup);
  });
});
