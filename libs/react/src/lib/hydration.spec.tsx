// @vitest-environment jsdom
import { preloadFormWidgets } from '@golemui/core';
import { act } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormComponent } from './FormComponent';
import { buildConfig, formDef, noopValidators, stubWidgetLoaders } from './ssr.fixture';

const formElement = () => <FormComponent config={buildConfig()} validators={noopValidators} />;

describe('hydrating server-rendered markup', () => {
  let warnings: string[];
  let consoleWarn: ReturnType<typeof vi.spyOn>;
  let consoleError: ReturnType<typeof vi.spyOn>;
  let root: Root | null;
  let container: HTMLDivElement | null;

  beforeAll(async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
  });

  // React 18's server renderer warns about useLayoutEffect whenever a DOM exists in the
  // process, which is exactly this spec's setup (renderToString inside jsdom). A real
  // server has no document, so the adapter picks useEffect there and nothing warns.
  // React 19 removed the warning. It is unrelated to hydration, so it is not captured.
  const isReact18ServerLayoutEffectWarning = (message: string) =>
    message.includes('useLayoutEffect does nothing on the server');

  beforeEach(() => {
    warnings = [];
    // React reports hydration mismatches through console.error (and some through
    // onRecoverableError below), so both are captured.
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args) => {
      warnings.push(args.join(' '));
    });
    consoleError = vi.spyOn(console, 'error').mockImplementation((...args) => {
      const message = args.join(' ');
      if (!isReact18ServerLayoutEffectWarning(message)) {
        warnings.push(message);
      }
    });
    root = null;
    container = null;
  });

  afterEach(async () => {
    if (root) {
      const mountedRoot = root;
      await act(async () => mountedRoot.unmount());
    }
    container?.remove();
    consoleWarn.mockRestore();
    consoleError.mockRestore();
  });

  const hydrate = async () => {
    const serverHtml = renderToString(formElement());

    container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.appendChild(container);

    // Read back through the DOM serializer, so the comparison below is not against a
    // raw string that serializes boolean attributes differently.
    const markupBeforeHydration = container.innerHTML;

    const hydrationContainer = container;
    await act(async () => {
      root = hydrateRoot(hydrationContainer, formElement(), {
        onRecoverableError: (error) => warnings.push(String(error)),
      });
    });

    return { serverHtml, container: hydrationContainer, markupBeforeHydration };
  };

  it('reports no hydration mismatch', async () => {
    await hydrate();

    expect(warnings).toEqual([]);
  });

  it('keeps the markup the server produced', async () => {
    const { container: hydrated, markupBeforeHydration } = await hydrate();

    expect(hydrated.innerHTML).toBe(markupBeforeHydration);
  });

  it('reuses the server DOM nodes instead of replacing them', async () => {
    const serverHtml = renderToString(formElement());
    container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.appendChild(container);
    const firstInputBeforeHydration = container.querySelector('input');

    const hydrationContainer = container;
    await act(async () => {
      root = hydrateRoot(hydrationContainer, formElement(), {
        onRecoverableError: (error) => warnings.push(String(error)),
      });
    });

    expect(warnings).toEqual([]);
    expect(hydrationContainer.querySelector('input')).toBe(firstInputBeforeHydration);
  });
  it('calls a load handler once after hydration and never during the server render', async () => {
    const formEvent = vi.fn();
    const loadingConfig = () => {
      // formDef is a shared module constant, so the test changes a copy.
      const loadingFormDef = structuredClone(formDef);
      (loadingFormDef.form.children[0] as Record<string, unknown>).on = { load: 'firstNameLoaded' };
      return { ...buildConfig(), formDef: loadingFormDef };
    };
    const loadingForm = () => (
      <FormComponent config={loadingConfig()} validators={noopValidators} formEvent={formEvent} />
    );

    const serverHtml = renderToString(loadingForm());
    expect(serverHtml).toContain('value="Ada"');
    expect(formEvent).not.toHaveBeenCalled();

    container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.appendChild(container);
    const hydrationContainer = container;
    await act(async () => {
      root = hydrateRoot(hydrationContainer, loadingForm(), {
        onRecoverableError: (error) => warnings.push(String(error)),
      });
    });

    expect(formEvent).toHaveBeenCalledTimes(1);
    expect(formEvent.mock.calls[0][0].name).toBe('firstNameLoaded');
  });
});
