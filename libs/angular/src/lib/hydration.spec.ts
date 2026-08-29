// @vitest-environment jsdom
import type { ApplicationRef } from '@angular/core';
import {
  type BootstrapContext,
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { preloadFormWidgets } from '@golemui/core';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { SsrHostComponent, stubWidgetLoaders } from './ssr.fixture';

const hostDocument = '<html><head></head><body><gui-ssr-host></gui-ssr-host></body></html>';

describe('hydrating server markup in a browser-like environment', () => {
  let appRef: ApplicationRef;
  let serverForm: Element | null;
  let serverInput: Element | null;
  const consoleMessages: string[] = [];

  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });

    // The providers are built inside the bootstrap callback: provideServerRendering sets
    // the global server-mode flag at call time, and destroying the platform clears the
    // flag only when the flag was set after the platform was created. The later client
    // bootstrap in this spec fails when the flag is still set.
    const html = await renderApplication(
      (context: BootstrapContext) =>
        bootstrapApplication(
          SsrHostComponent,
          { providers: [provideServerRendering(), provideClientHydration()] },
          context,
        ),
      { document: hostDocument },
    );

    // The whole body must be copied: hydration needs the annotations and the markers the
    // serializer placed next to the host element, not only the host element itself.
    const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1];
    if (!body) {
      throw new Error('server render produced no body');
    }
    document.body.innerHTML = body;

    serverForm = document.querySelector('form');
    serverInput = document.querySelector('input');

    const record = (...args: unknown[]) => {
      consoleMessages.push(args.map(String).join(' '));
    };
    vi.spyOn(console, 'error').mockImplementation(record);
    vi.spyOn(console, 'warn').mockImplementation(record);

    appRef = await bootstrapApplication(SsrHostComponent, {
      providers: [provideClientHydration()],
    });
    await appRef.whenStable();
  });

  afterAll(() => {
    appRef?.destroy();
    vi.restoreAllMocks();
  });

  it('reuses the server DOM instead of re-rendering it', () => {
    expect(serverForm).not.toBeNull();
    expect(document.querySelector('form')).toBe(serverForm);
    expect(document.querySelector('input')).toBe(serverInput);
  });

  it('keeps the server values after hydration', () => {
    const inputs = [...document.querySelectorAll('input')];

    expect(inputs).toHaveLength(2);
    expect((inputs[0] as HTMLInputElement).value).toBe('Ada');
    expect((inputs[1] as HTMLInputElement).value).toBe('Lovelace');
  });

  it('logs no hydration warnings', () => {
    const hydrationMessages = consoleMessages.filter(
      (message) => message.includes('NG05') || message.toLowerCase().includes('hydration'),
    );

    expect(hydrationMessages).toEqual([]);
  });
});
