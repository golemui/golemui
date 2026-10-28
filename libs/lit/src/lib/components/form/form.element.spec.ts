// @vitest-environment jsdom
import { type FormHealth, identityTranslator } from '@golemui/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildConfig, noopValidators, stubWidgetLoaders } from '../../ssr.fixture';
import type { FormElement } from './form.element';

// `FormElement.config` is typed with the widget instance, the fixture with the widget class.
function setConfig(form: FormElement, config: ReturnType<typeof buildConfig>) {
  form.config = config as unknown as FormElement['config'];
}

async function mountForm(config = buildConfig()): Promise<FormElement> {
  const form = document.createElement('gui-core-form') as FormElement;
  form.validators = noopValidators;
  setConfig(form, config);
  document.body.append(form);
  await form.updateComplete;
  return form;
}

function recordEvents<Detail>(target: EventTarget, name: string): Detail[] {
  const details: Detail[] = [];
  target.addEventListener(name, (event) => details.push((event as CustomEvent<Detail>).detail));
  return details;
}

async function waitFor(isReady: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (isReady()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('The condition did not become true in 500 ms.');
}

function setErroredHealth(form: FormElement, message: string) {
  form.context.store.dispatch({
    type: 'SET_FORM_HEALTH',
    payload: { formHealth: { status: 'errored', message, code: 1 } },
  });
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('a gui-core-form that moves in the DOM', () => {
  it('keeps its store and follows the store health after the move', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const form = await mountForm();
    const store = form.context.store;
    const healths = recordEvents<FormHealth>(form, 'formHealth');

    const otherParent = document.createElement('section');
    document.body.append(otherParent);
    otherParent.append(form);
    await form.updateComplete;
    setErroredHealth(form, 'after the move');
    await form.updateComplete;

    expect(form.context.store).toBe(store);
    expect(healths).toEqual([{ status: 'errored', message: 'after the move', code: 1 }]);
    expect(form.querySelector('.gui-form-health-error')?.textContent).toContain('after the move');
  });

  it('does not log or dispatch an unchanged errored health again', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const form = await mountForm();
    setErroredHealth(form, 'before the move');
    const healths = recordEvents<FormHealth>(form, 'formHealth');

    const otherParent = document.createElement('section');
    document.body.append(otherParent);
    otherParent.append(form);
    await form.updateComplete;

    expect(healths).toEqual([]);
    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it('follows a store that a new config created while the form was detached', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const form = await mountForm();
    const healths = recordEvents<FormHealth>(form, 'formHealth');

    form.remove();
    setConfig(form, buildConfig());
    await form.updateComplete;
    setErroredHealth(form, 'while detached');
    expect(healths).toEqual([]);

    document.body.append(form);
    await form.updateComplete;

    expect(healths).toEqual([{ status: 'errored', message: 'while detached', code: 1 }]);
    expect(form.querySelector('.gui-form-health-error')?.textContent).toContain('while detached');
  });

  it('applies a language change that happened while the form was detached', async () => {
    const localization = identityTranslator('en-US');
    const form = await mountForm({ ...buildConfig(), localization });

    form.remove();
    localization.setLang('ar');
    document.body.append(form);
    await form.updateComplete;

    expect(form.context.store.getState().lang).toBe('ar');
    expect(form.querySelector('form')?.getAttribute('dir')).toBe('rtl');
  });
});

describe('a widget that fails to load', () => {
  const loadError = {
    status: 'errored',
    message: '[30] Widget "textinput" could not be loaded',
    code: 30,
  };

  it('sets the store health to errored, and the form shows the error and dispatches it', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const config = buildConfig();
    config.widgetLoaders = {
      ...stubWidgetLoaders,
      textinput: () => Promise.reject(new Error('The chunk did not load')),
    } as typeof config.widgetLoaders;
    const healths = recordEvents<FormHealth>(document.body, 'formHealth');

    const form = await mountForm(config);
    await waitFor(() => form.context.store.getState().formHealth.status === 'errored');
    await form.updateComplete;

    expect(form.context.store.getState().formHealth).toEqual(loadError);
    expect(healths).toEqual([{ status: 'ok' }, loadError]);
    expect(form.querySelector('.gui-form-health-error')?.textContent).toContain(loadError.message);
  });

  it('writes a load that fails after a new config into the old store', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let failLoad: (error: Error) => void = () => undefined;
    let loadStarted = false;
    const config = buildConfig();
    config.widgetLoaders = {
      ...stubWidgetLoaders,
      textinput: () =>
        new Promise((_, reject) => {
          loadStarted = true;
          failLoad = reject;
        }),
    } as typeof config.widgetLoaders;
    const form = await mountForm(config);
    await waitFor(() => loadStarted);
    const oldStore = form.context.store;

    setConfig(form, buildConfig());
    await form.updateComplete;
    const newStore = form.context.store;
    failLoad(new Error('The chunk did not load'));
    await waitFor(() => oldStore.getState().formHealth.status === 'errored');
    await form.updateComplete;

    expect(newStore).not.toBe(oldStore);
    expect(newStore.getState().formHealth).toEqual({ status: 'ok' });
    expect(form.querySelector('.gui-form-health-error')).toBeNull();
  });
});
