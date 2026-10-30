// @vitest-environment jsdom
import { Component, type ApplicationRef } from '@angular/core';
import {
  type BootstrapContext,
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { preloadFormWidgets, type FormEvent } from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { FormComponent } from './components/form/form.component';
import { widgetLoaders } from './widget.loaders';

/**
 * Hydration spec against the real widget set: the server markup of `gui-form` goes into the
 * DOM, and a client bootstrap with `provideClientHydration` hydrates it, as an app does.
 */

const config: GuiFormInitConfig = {
  formName: 'gui-angular-hydration-form',
  formDef: {
    form: {
      uid: 'root',
      kind: 'layout',
      type: 'grid',
      children: [
        {
          kind: 'input',
          type: 'textinput',
          path: 'firstName',
          label: 'First name',
          on: { load: 'firstNameLoaded' },
        },
        { kind: 'input', type: 'checkbox', path: 'acceptTerms', label: 'I accept the terms' },
        { kind: 'action', type: 'button', label: 'Send', actionType: 'submit' },
      ],
    },
  },
  data: { firstName: 'Ada', acceptTerms: true },
};

const formEvents: FormEvent[] = [];

@Component({
  standalone: true,
  selector: 'gui-hydration-host',
  imports: [FormComponent],
  template: `<gui-form [config]="config" (formEvent)="onFormEvent($event)" />`,
})
class HydrationHostComponent {
  config = config;
  onFormEvent(event: FormEvent) {
    formEvents.push(event);
  }
}

const hostDocument =
  '<html><head></head><body><gui-hydration-host></gui-hydration-host></body></html>';

// The gui-* elements render on the microtask schedule, so one macrotask completes every render.
const afterRenderSchedule = () => new Promise((resolve) => setTimeout(resolve, 0));

// The Angular hosts are gui-<type>-{control,interactive,display,layout} and the form shell. Every
// other gui-* tag is a lit element that holds its render while it has defer-hydration.
const angularHostTags = new Set([
  'gui-hydration-host',
  'gui-form',
  'gui-widget-set-form',
  'gui-core-form',
  'gui-default-form-health-boundary',
]);
const litElements = () =>
  Array.from(document.body.querySelectorAll('*')).filter((element) => {
    const tag = element.localName;
    return (
      tag.startsWith('gui-') &&
      !angularHostTags.has(tag) &&
      !/-(control|interactive|display|layout)$/.test(tag)
    );
  });

// platform-server copies the domino DOM classes (Node, NodeList, Element...) onto globalThis. An
// app renders on the server in another process, so the client must get the jsdom classes back.
async function withDomClassesRestored<T>(render: () => Promise<T>): Promise<T> {
  const capitalizedNames = () =>
    Object.getOwnPropertyNames(globalThis).filter((name) => /^[A-Z]/.test(name));
  const descriptors = new Map(
    capitalizedNames().map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
  );
  try {
    return await render();
  } finally {
    for (const name of capitalizedNames()) {
      const descriptor = descriptors.get(name);
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      } else {
        delete (globalThis as Record<string, unknown>)[name];
      }
    }
  }
}

describe('hydrating a server-rendered gui-form', () => {
  let appRef: ApplicationRef | undefined;
  let litElementsBeforeHydration: Element[] = [];
  let deferHydrationBeforeHydration: (string | null)[] = [];
  let eventCountAfterServerRender = 0;
  const consoleMessages: string[] = [];
  const consoleLogs: string[] = [];

  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders });

    // Recorded from the server render on, so a warning of either side fails the spec.
    const record = (...args: unknown[]) => consoleMessages.push(args.map(String).join(' '));
    vi.spyOn(console, 'error').mockImplementation(record);
    vi.spyOn(console, 'warn').mockImplementation(record);
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      consoleLogs.push(args.map(String).join(' '));
    });

    // The providers are built inside the bootstrap callback: provideServerRendering sets the
    // global server-mode flag at call time, and the client bootstrap below fails while it is set.
    const html = await withDomClassesRestored(() =>
      renderApplication(
        (context: BootstrapContext) =>
          bootstrapApplication(
            HydrationHostComponent,
            { providers: [provideServerRendering(), provideClientHydration()] },
            context,
          ),
        { document: hostDocument },
      ),
    );
    eventCountAfterServerRender = formEvents.length;

    // Hydration needs the annotations and markers next to the host element, so the whole body
    // is copied.
    const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1];
    if (!body) {
      throw new Error('server render produced no body');
    }
    document.body.innerHTML = body;
    litElementsBeforeHydration = litElements();
    deferHydrationBeforeHydration = litElementsBeforeHydration.map((element) =>
      element.getAttribute('defer-hydration'),
    );

    appRef = await bootstrapApplication(HydrationHostComponent, {
      providers: [provideClientHydration()],
    });
    await appRef.whenStable();
    await afterRenderSchedule();
  }, 30_000);

  afterAll(() => {
    appRef?.destroy();
    vi.restoreAllMocks();
  });

  it('holds every lit element of the server markup with defer-hydration', () => {
    expect(litElementsBeforeHydration.map((element) => element.localName)).toEqual(
      expect.arrayContaining(['gui-textinput', 'gui-checkbox', 'gui-button']),
    );
    expect(deferHydrationBeforeHydration).toEqual(litElementsBeforeHydration.map(() => ''));
  });

  it('removes defer-hydration from every lit element and keeps the server nodes', () => {
    expect(litElements()).toHaveLength(litElementsBeforeHydration.length);
    litElements().forEach((element, index) => {
      expect(element).toBe(litElementsBeforeHydration[index]);
    });
    for (const element of litElements()) {
      expect(element.hasAttribute('defer-hydration'), element.localName).toBe(false);
    }
  });

  it('renders the elements with the server values', () => {
    expect(document.querySelector<HTMLInputElement>('#firstName-textinput')?.value).toBe('Ada');
    expect(document.querySelector<HTMLInputElement>('#acceptTerms-checkbox')?.checked).toBe(true);
    expect(document.querySelector('gui-button button')?.textContent).toContain('Send');
  });

  it('fires the load event once, on the client only', () => {
    expect(eventCountAfterServerRender).toBe(0);
    expect(formEvents).toEqual([expect.objectContaining({ name: 'firstNameLoaded' })]);
  });

  it('logs no hydration warnings', () => {
    // Angular logs this summary in development mode after a successful hydration.
    expect(consoleLogs.join('\n')).toMatch(
      /Angular hydrated \d+ component\(s\).*0 component\(s\) were skipped/,
    );
    const hydrationMessages = consoleMessages.filter(
      (message) => message.includes('NG05') || message.toLowerCase().includes('hydration'),
    );

    expect(hydrationMessages).toEqual([]);
  });
});
