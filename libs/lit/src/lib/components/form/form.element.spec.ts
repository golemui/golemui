// @vitest-environment jsdom
import { type FormHealth, identityTranslator } from '@golemui/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildConfig, noopValidators } from '../../ssr.fixture';
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
