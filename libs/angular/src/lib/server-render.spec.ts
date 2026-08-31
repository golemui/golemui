// @vitest-environment node
import type { Type } from '@angular/core';
import {
  type BootstrapContext,
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { preloadFormWidgets } from '@golemui/core';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  recordedFormEvents,
  SsrEventRecordingHostComponent,
  SsrHostComponent,
  SsrNotPreloadedHostComponent,
  stubWidgetLoaders,
} from './ssr.fixture';

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
const renderHost = (host: Type<unknown>) =>
  renderApplication(
    (context: BootstrapContext) =>
      bootstrapApplication(
        host,
        { providers: [provideServerRendering(), provideClientHydration()] },
        context,
      ),
    { document: hostDocument },
  );

const renderForm = () => renderHost(SsrHostComponent);

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

  it('does not run load handlers, because load is a client lifecycle event', async () => {
    recordedFormEvents.length = 0;

    const html = await renderHost(SsrEventRecordingHostComponent);

    expect(recordedFormEvents).toEqual([]);
    // Listening for form events must not change the emitted markup either.
    expect(html).toBe(await renderForm());
  });
});

describe('server rendering without preloaded widgets', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns per widget and leaves the markup empty where the widget would render', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const html = await renderHost(SsrNotPreloadedHostComponent);

    expect(warn).toHaveBeenCalledWith(
      '[GolemUI] Widget "flex" was not preloaded; its server markup will be empty. ' +
        'Call preloadFormWidgets() before rendering.',
    );
    expect(html).toContain('<form');
    expect(html).not.toContain('<input');
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
