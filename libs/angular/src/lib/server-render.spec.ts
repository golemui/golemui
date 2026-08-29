// @vitest-environment node
import {
  type BootstrapContext,
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { preloadFormWidgets } from '@golemui/core';
import { beforeAll, describe, expect, it } from 'vitest';
import { SsrHostComponent, stubWidgetLoaders } from './ssr.fixture';

// Dev-mode style handling reads the global document for the base href. A Node process has
// none, so this stub provides a document with an empty head.
(globalThis as { document?: unknown }).document ??= {
  head: { querySelector: () => null },
  baseURI: 'http://localhost/',
};

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

describe('server rendering a form in a plain node environment', () => {
  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
  });

  it('emits every widget of the definition', async () => {
    const html = await renderForm();

    expect(html).toContain('<form');
    expect(html).toContain('class="stub-flex"');
    expect(html.match(/<input/g)).toHaveLength(2);
  });

  it('emits the values the form was initialized with', async () => {
    const html = await renderForm();

    expect(html).toContain('value="Ada"');
    expect(html).toContain('value="Lovelace"');
  });

  it('renders no loading placeholder, because the widgets were preloaded', async () => {
    const html = await renderForm();

    expect(html.toLowerCase()).not.toContain('loading');
  });

  it('renders no error text, because an untouched form has no errors', async () => {
    const html = await renderForm();

    expect(html.toLowerCase()).not.toContain('gui-form-health-error');
    expect(html.toLowerCase()).not.toContain('golemui form error');
  });

  it('annotates the markup for hydration', async () => {
    const html = await renderForm();

    expect(html).toContain(' ngh=');
  });
});

describe('server rendering determinism', () => {
  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
  });

  it('produces identical markup across two separately rendered applications', async () => {
    const first = await renderForm();
    const second = await renderForm();

    expect(first).toBe(second);
  });

  it('gives every widget the same uid in both renders', async () => {
    const uids = (html: string) => [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);

    expect(uids(await renderForm())).toEqual(uids(await renderForm()));
  });

  it('gives the form the configured formName as its id', async () => {
    const html = await renderForm();

    expect(html).toMatch(/<form [^>]*id="ssr-spec-form"/);
  });
});
