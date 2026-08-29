// @vitest-environment jsdom
import { preloadFormWidgets } from '@golemui/core';
import { createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import FormComponent from './FormComponent.vue';
import { buildConfig, noopValidators, stubWidgetLoaders } from './ssr.fixture';

const rootComponent = () => ({
  render: () => h(FormComponent, { config: buildConfig(), validators: noopValidators }),
});

describe('hydrating server-rendered markup', () => {
  let warnings: string[];
  let consoleWarn: ReturnType<typeof vi.spyOn>;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
  });

  beforeEach(() => {
    warnings = [];
    // Not every hydration warning includes a component instance, so warnHandler alone
    // would miss some of them.
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args) => {
      warnings.push(args.join(' '));
    });
    consoleError = vi.spyOn(console, 'error').mockImplementation((...args) => {
      warnings.push(args.join(' '));
    });
  });

  afterEach(() => {
    consoleWarn.mockRestore();
    consoleError.mockRestore();
  });

  const hydrate = async () => {
    const serverHtml = await renderToString(createSSRApp(rootComponent()));

    const container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.appendChild(container);

    // Read back through the DOM serializer, so the comparison below is not against a
    // raw string that serializes boolean attributes differently.
    const markupBeforeHydration = container.innerHTML;

    const app = createSSRApp(rootComponent());
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(container);

    return { serverHtml, container, app, markupBeforeHydration };
  };

  it('reports no hydration mismatch', async () => {
    await hydrate();

    expect(warnings).toEqual([]);
  });

  it('keeps the markup the server produced', async () => {
    const { container, markupBeforeHydration } = await hydrate();

    expect(container.innerHTML).toBe(markupBeforeHydration);
  });

  it('reuses the server DOM nodes instead of replacing them', async () => {
    const serverHtml = await renderToString(createSSRApp(rootComponent()));
    const container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.appendChild(container);
    const firstInputBeforeHydration = container.querySelector('input');

    const app = createSSRApp(rootComponent());
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(container);

    expect(container.querySelector('input')).toBe(firstInputBeforeHydration);
  });

  it('runs load handlers once the client has mounted, and only then', async () => {
    const onFormEvent = vi.fn();
    const root = () => ({
      render: () =>
        h(FormComponent, { config: buildConfig(), validators: noopValidators, onFormEvent }),
    });

    const serverHtml = await renderToString(createSSRApp(root()));
    expect(onFormEvent).not.toHaveBeenCalled();

    const container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.appendChild(container);

    const app = createSSRApp(root());
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(container);
    await nextTick();

    expect(onFormEvent).toHaveBeenCalledTimes(1);
    expect(onFormEvent).toHaveBeenCalledWith(expect.objectContaining({ name: 'stubLoaded' }));
    expect(warnings).toEqual([]);
  });
});
