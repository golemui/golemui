// @vitest-environment jsdom
import { preloadFormWidgets, type FormEvent } from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import { createSSRApp, h, nextTick, type App } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import GuiForm from './components/Form';
import { widgetLoaders } from './widget.loaders';

/**
 * Hydration spec against the real widget set: the server markup of `GuiForm` goes into the DOM,
 * and `createSSRApp` hydrates it, as an app does.
 */

const config: GuiFormInitConfig = {
  formName: 'gui-vue-hydration-form',
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
        {
          kind: 'input',
          type: 'select',
          path: 'size',
          label: 'Size',
          props: {
            options: [
              { value: 's', label: 'S' },
              { value: 'm', label: 'M' },
            ],
          },
        },
        { kind: 'action', type: 'button', label: 'Send', actionType: 'submit' },
      ],
    },
  },
  data: { firstName: 'Ada', acceptTerms: true, size: 'm' },
};

// The gui-* elements render on the microtask schedule, so one macrotask completes every render.
const afterRenderSchedule = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('hydrating a server-rendered GuiForm', () => {
  let messages: string[];
  let app: App | undefined;
  let container: HTMLDivElement;
  const formEvents: FormEvent[] = [];

  const rootComponent = () => ({
    render: () =>
      h(GuiForm, {
        config,
        onFormEvent: (event: FormEvent) => formEvents.push(event),
      }),
  });

  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders });
  }, 30_000);

  beforeEach(() => {
    messages = [];
    formEvents.length = 0;
    // Not every hydration warning includes a component instance, so warnHandler alone would
    // miss some of them.
    const record = (...args: unknown[]) => messages.push(args.map(String).join(' '));
    vi.spyOn(console, 'warn').mockImplementation(record);
    vi.spyOn(console, 'error').mockImplementation(record);
  });

  afterEach(() => {
    app?.unmount();
    app = undefined;
    container?.remove();
    vi.restoreAllMocks();
  });

  const renderOnServer = async () => {
    const serverHtml = await renderToString(createSSRApp(rootComponent()));
    container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.append(container);
    return serverHtml;
  };

  const hydrate = async () => {
    app = createSSRApp(rootComponent());
    app.config.warnHandler = (message) => messages.push(message);
    app.mount(container);
    await nextTick();
    await afterRenderSchedule();
  };

  it('renders the widgets on the server without a load event', async () => {
    const serverHtml = await renderOnServer();

    expect(serverHtml).toMatch(/<form[^>]*id="gui-vue-hydration-form"/);
    expect(serverHtml).toMatch(/<gui-textinput[^>]*uid="firstName-textinput"/);
    expect(serverHtml).toMatch(/<gui-checkbox[^>]*uid="acceptTerms-checkbox"/);
    expect(serverHtml).toMatch(/<gui-select[^>]*uid="size-select"/);
    expect(serverHtml).not.toContain('gui-form-health-error');
    expect(formEvents).toEqual([]);
  });

  it('reports no hydration mismatch and keeps the server nodes', async () => {
    await renderOnServer();
    const widgetElements = () =>
      Array.from(container.querySelectorAll('gui-textinput, gui-checkbox, gui-select'));
    const serverForm = container.querySelector('form');
    const serverElements = widgetElements();

    await hydrate();

    expect(messages).toEqual([]);
    expect(container.querySelector('form')).toBe(serverForm);
    expect(serverElements).toHaveLength(3);
    widgetElements().forEach((element, index) => expect(element).toBe(serverElements[index]));
    expect(widgetElements()).toHaveLength(3);
  });

  it('reports a mismatch when the client form name differs from the server', async () => {
    await renderOnServer();

    app = createSSRApp({
      render: () => h(GuiForm, { config: { ...config, formName: 'another-form' } }),
    });
    app.config.warnHandler = (message) => messages.push(message);
    app.mount(container);
    await nextTick();

    expect(messages.join('\n')).toContain('mismatch');
  });

  it('shows the values and fires the load event once after hydration', async () => {
    await renderOnServer();

    await hydrate();

    const firstName = container.querySelector<HTMLInputElement>('#firstName-textinput');
    expect(firstName?.value).toBe('Ada');
    expect(container.querySelector<HTMLInputElement>('#acceptTerms-checkbox')?.checked).toBe(true);
    expect(container.querySelector<HTMLSelectElement>('#size-select')?.value).toBe('m');
    expect(formEvents).toEqual([expect.objectContaining({ name: 'firstNameLoaded' })]);
  });
});
