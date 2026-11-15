// @vitest-environment jsdom
import { type Action, type FormHealth, identityTranslator } from '@golemui/core';
import { safeDefine } from '@golemui/lit-utils';
import { html, nothing } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildConfig,
  noopValidators,
  recordActionsByStore,
  stubWidgetLoaders,
} from '../../ssr.fixture';
import { FormElement } from './form.element';
import type { FormHealthBoundary } from './form-health-boundary';

// `FormElement.config` is typed with the widget instance, the fixture with the widget class.
function setConfig(form: FormElement, config: ReturnType<typeof buildConfig>) {
  form.config = config as unknown as FormElement['config'];
}

async function mountForm(
  config = buildConfig(),
  formHealthBoundary?: FormHealthBoundary,
): Promise<FormElement> {
  const form = document.createElement('gui-core-form') as FormElement;
  form.validators = noopValidators;
  form.formHealthBoundary = formHealthBoundary;
  setConfig(form, config);
  document.body.append(form);
  await form.updateComplete;
  return form;
}

// Removes the listeners of `recordEvents` after each test.
let listeners = new AbortController();

function recordEvents<Detail>(target: EventTarget, name: string): Detail[] {
  const details: Detail[] = [];
  target.addEventListener(name, (event) => details.push((event as CustomEvent<Detail>).detail), {
    signal: listeners.signal,
  });
  return details;
}

function setErroredHealth(form: FormElement, message: string) {
  form.context.store.dispatch({
    type: 'SET_FORM_HEALTH',
    payload: { formHealth: { status: 'errored', message, code: 1 } },
  });
}

afterEach(() => {
  listeners.abort();
  listeners = new AbortController();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function createFormWithoutMounting(): FormElement {
  const form = document.createElement('gui-core-form') as FormElement;
  form.validators = noopValidators;
  return form;
}

async function startForm(form: FormElement) {
  document.body.append(form);
  await form.updateComplete;
}

const duplicateUidFormDef = {
  form: {
    uid: 'root',
    kind: 'layout',
    type: 'flex',
    children: [
      { uid: 'same', kind: 'input', type: 'textinput', path: 'firstName' },
      { uid: 'same', kind: 'input', type: 'textinput', path: 'lastName' },
    ],
  },
};

const duplicateUidHealth: FormHealth = {
  status: 'errored',
  code: 21,
  message:
    '[21] Duplicate UID "same": Assigned to widget "textinput" at "firstName" and "textinput" at "lastName".',
};

describe('setData and setMeta before the form starts', () => {
  it('replaces the config data with the data of a setData call before the form is in the page', async () => {
    const form = createFormWithoutMounting();
    setConfig(form, buildConfig());

    form.setData({ firstName: 'Bob' });
    await startForm(form);

    expect(form.context.store.getState().data).toEqual({ firstName: 'Bob' });
  });

  it('keeps a setData call made before the config is set', async () => {
    const form = createFormWithoutMounting();

    form.setData({ firstName: 'Bob' });
    setConfig(form, buildConfig());
    await startForm(form);

    expect(form.context.store.getState().data).toEqual({ firstName: 'Bob' });
  });

  it('keeps a setData call made before two config assignments that come before the first update', async () => {
    const form = createFormWithoutMounting();

    form.setData({ firstName: 'Bob' });
    setConfig(form, buildConfig());
    setConfig(form, { ...buildConfig(), localization: identityTranslator('en-US') });
    await startForm(form);

    expect(form.context.store.getState().data).toEqual({ firstName: 'Bob' });
  });

  it('keeps a setData call made between two config assignments that come before the first update', async () => {
    const form = createFormWithoutMounting();

    setConfig(form, buildConfig());
    form.setData({ firstName: 'Bob' });
    setConfig(form, { ...buildConfig(), localization: identityTranslator('en-US') });
    await startForm(form);

    expect(form.context.store.getState().data).toEqual({ firstName: 'Bob' });
  });

  it('uses the last setData call when there are several', async () => {
    const form = createFormWithoutMounting();
    setConfig(form, buildConfig());

    form.setData({ firstName: 'Bob' });
    form.setData({ firstName: 'Carol' });
    await startForm(form);

    expect(form.context.store.getState().data).toEqual({ firstName: 'Carol' });
  });

  it('replaces the config meta with the meta of an early setMeta call', async () => {
    const form = createFormWithoutMounting();
    setConfig(form, { ...buildConfig(), meta: { tier: 'free' } });

    form.setMeta({ tier: 'paid' });
    await startForm(form);

    expect(form.context.store.getState().meta).toEqual({ tier: 'paid' });
  });

  it('uses the data of a later config, not the early value, when the form starts again', async () => {
    const form = createFormWithoutMounting();
    setConfig(form, buildConfig());
    form.setData({ firstName: 'Bob' });
    await startForm(form);

    setConfig(form, { ...buildConfig(), data: { firstName: 'Dana' } });
    await form.updateComplete;

    expect(form.context.store.getState().data).toEqual({ firstName: 'Dana' });
  });

  it('keeps a setData call made by a formHealth listener during the first start', async () => {
    const form = createFormWithoutMounting();
    setConfig(form, buildConfig());
    form.addEventListener('formHealth', () => form.setData({ firstName: 'Bob' }), {
      once: true,
      signal: listeners.signal,
    });

    await startForm(form);

    expect(form.context.store.getState().data).toEqual({ firstName: 'Bob' });
  });

  it('sends one SET_DATA and one SET_META to the middlewares when an early call replaces the config values', async () => {
    const form = createFormWithoutMounting();
    const actionTypes: string[] = [];
    setConfig(form, {
      ...buildConfig(),
      middlewares: [
        () => (next) => (action) => {
          actionTypes.push(action.type);
          return next(action);
        },
      ],
    });

    form.setData({ firstName: 'Bob' });
    form.setMeta({ tier: 'paid' });
    await startForm(form);

    expect(actionTypes.filter((type) => type === 'SET_DATA')).toHaveLength(1);
    expect(actionTypes.filter((type) => type === 'SET_META')).toHaveLength(1);
  });

  it('applies a setData call after the start at once', async () => {
    const form = await mountForm();

    form.setData({ firstName: 'Bob' });

    expect(form.context.store.getState().data).toEqual({ firstName: 'Bob' });
  });
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
    setErroredHealth(form, 'old store');
    await form.updateComplete;

    form.remove();
    setConfig(form, buildConfig());
    await form.updateComplete;
    expect(form.health).toEqual({ status: 'ok' });
    expect(form.querySelector('.gui-form-health-error')).toBeNull();

    document.body.append(form);
    const healths = recordEvents<FormHealth>(form, 'formHealth');
    setErroredHealth(form, 'new store');
    await form.updateComplete;

    expect(healths).toEqual([{ status: 'errored', message: 'new store', code: 1 }]);
    expect(form.querySelector('.gui-form-health-error')?.textContent).toContain('new store');
  });

  it('stops listening to the language while detached, and applies a change on reconnect', async () => {
    const localization = identityTranslator('en-US');
    const form = await mountForm({ ...buildConfig(), localization });

    form.remove();
    localization.setLang('ar');
    expect(form.context.store.getState().lang).toBe('en-US');

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
    await vi.waitFor(() => expect(form.context.store.getState().formHealth.status).toBe('errored'));
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
    await vi.waitFor(() => expect(loadStarted).toBe(true));
    const oldStore = form.context.store;

    setConfig(form, buildConfig());
    await form.updateComplete;
    const newStore = form.context.store;
    failLoad(new Error('The chunk did not load'));
    await vi.waitFor(() => expect(oldStore.getState().formHealth.status).toBe('errored'));
    await form.updateComplete;

    expect(newStore).not.toBe(oldStore);
    expect(newStore.getState().formHealth).toEqual({ status: 'ok' });
    expect(form.querySelector('.gui-form-health-error')).toBeNull();
  });

  it('only logs the failure when no form is above the widget', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const widget = document.createElement('gui-widget') as HTMLElement & { widget: unknown };
    widget.widget = { uid: 'name', kind: 'input', type: 'textinput', path: 'name' };

    document.body.append(widget);

    await vi.waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(
        'Widget "textinput" could not be loaded',
        expect.any(TypeError),
      ),
    );
  });
});

describe('the health of a form with an invalid definition', () => {
  it('dispatches only the errored health when the form starts', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const healths = recordEvents<FormHealth>(document.body, 'formHealth');

    await mountForm({ ...buildConfig(), formDef: duplicateUidFormDef });

    expect(healths).toEqual([duplicateUidHealth]);
  });

  it('dispatches only the errored health for a new config with an invalid definition', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const form = await mountForm();
    const healths = recordEvents<FormHealth>(form, 'formHealth');

    setConfig(form, { ...buildConfig(), formDef: duplicateUidFormDef });
    await form.updateComplete;

    expect(healths).toEqual([duplicateUidHealth]);
  });

  it('dispatches ok for a new config with a valid definition', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const form = await mountForm({ ...buildConfig(), formDef: duplicateUidFormDef });
    const healths = recordEvents<FormHealth>(form, 'formHealth');

    setConfig(form, buildConfig());
    await form.updateComplete;

    expect(healths).toEqual([{ status: 'ok' }]);
    expect(form.querySelector('.gui-form-health-error')).toBeNull();
  });
});

describe('setHealth before the form starts', () => {
  const earlyHealth: FormHealth = { status: 'errored', code: 10_001, message: 'early call' };
  const listenerHealth: FormHealth = { status: 'errored', code: 10_002, message: 'listener call' };

  it('dispatches ok and then the health of an early setHealth call for a valid form', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const form = createFormWithoutMounting();
    setConfig(form, buildConfig());
    const healths = recordEvents<FormHealth>(form, 'formHealth');

    form.setHealth(earlyHealth);
    await startForm(form);

    expect(healths).toEqual([{ status: 'ok' }, earlyHealth]);
  });

  it('dispatches and logs the definition error and then the health of an early setHealth call', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const form = createFormWithoutMounting();
    setConfig(form, { ...buildConfig(), formDef: duplicateUidFormDef });
    const healths = recordEvents<FormHealth>(form, 'formHealth');

    form.setHealth(earlyHealth);
    await startForm(form);

    expect(healths).toEqual([duplicateUidHealth, earlyHealth]);
    expect(consoleError).toHaveBeenCalledWith(
      'GolemUI form failed to initialize:',
      duplicateUidHealth.message,
    );
  });

  it('sends the first event to every listener before a setHealth call that a listener makes during it', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const form = createFormWithoutMounting();
    setConfig(form, buildConfig());
    form.addEventListener('formHealth', () => form.setHealth(listenerHealth), {
      once: true,
      signal: listeners.signal,
    });
    // Added after the listener that calls setHealth. A call dispatched at once would reach this
    // listener before the first event.
    const healths = recordEvents<FormHealth>(form, 'formHealth');

    await startForm(form);

    expect(healths).toEqual([{ status: 'ok' }, listenerHealth]);
  });
});

describe('a call after a new config and before the form starts with it', () => {
  const draft = { firstName: 'Bob' };
  const callHealth: FormHealth = { status: 'errored', code: 10_004, message: 'call after config' };

  /** Records the actions of each store, and builds configs with the recording middleware. */
  const createRecorder = () => {
    const { actionTypesByStore, middleware } = recordActionsByStore();
    const configWith = (values: Record<string, unknown> = {}) =>
      ({ ...buildConfig(), middlewares: [middleware], ...values }) as ReturnType<
        typeof buildConfig
      >;
    return { actionTypesByStore, configWith };
  };

  /** Mounts a form, waits for its widgets and clears the actions of its start. */
  async function mountRecordedForm() {
    const recorder = createRecorder();
    const form = await mountForm(recorder.configWith());
    await vi.waitFor(() => expect(form.querySelector('gui-stub-flex')).not.toBeNull());
    const oldStoreActions = recorder.actionTypesByStore[0];
    oldStoreActions.length = 0;
    return { form, oldStoreActions, recorder };
  }

  const countOf = (actionTypes: string[], actionType: string) =>
    actionTypes.filter((type) => type === actionType).length;

  it('starts the new form with the data of a setData call made after the new config', async () => {
    const { form, oldStoreActions, recorder } = await mountRecordedForm();

    setConfig(form, recorder.configWith({ data: { firstName: 'Dana' } }));
    form.setData(draft);
    await form.updateComplete;

    expect(form.context.store.getState().data).toEqual(draft);
    expect(oldStoreActions).toEqual([]);
    expect(recorder.actionTypesByStore).toHaveLength(2);
    expect(countOf(recorder.actionTypesByStore[1], 'SET_DATA')).toBe(1);
  });

  it('starts the new form with the meta of a setMeta call made after the new config', async () => {
    const { form, oldStoreActions, recorder } = await mountRecordedForm();

    setConfig(form, recorder.configWith({ meta: { tier: 'free' } }));
    form.setMeta({ tier: 'paid' });
    await form.updateComplete;

    expect(form.context.store.getState().meta).toEqual({ tier: 'paid' });
    expect(oldStoreActions).toEqual([]);
    expect(recorder.actionTypesByStore).toHaveLength(2);
    expect(countOf(recorder.actionTypesByStore[1], 'SET_META')).toBe(1);
  });

  it('dispatches ok for the new form and then the health of a setHealth call made after the new config', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { form, oldStoreActions, recorder } = await mountRecordedForm();
    const healths = recordEvents<FormHealth>(form, 'formHealth');

    setConfig(form, recorder.configWith());
    form.setHealth(callHealth);
    await form.updateComplete;

    expect(healths).toEqual([{ status: 'ok' }, callHealth]);
    expect(form.context.store.getState().formHealth).toEqual(callHealth);
    expect(oldStoreActions).toEqual([]);
  });

  it('dispatches the definition error of the new form and then the health of a setHealth call made after the new config', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { form, oldStoreActions, recorder } = await mountRecordedForm();
    const healths = recordEvents<FormHealth>(form, 'formHealth');

    setConfig(form, recorder.configWith({ formDef: duplicateUidFormDef }));
    form.setHealth(callHealth);
    await form.updateComplete;

    expect(healths).toEqual([duplicateUidHealth, callHealth]);
    expect(oldStoreActions).toEqual([]);
  });

  it('gives a setData call made before the new config to the old form', async () => {
    const { form, oldStoreActions, recorder } = await mountRecordedForm();
    const oldStore = form.context.store;

    form.setData(draft);
    setConfig(form, recorder.configWith({ data: { firstName: 'Dana' } }));
    await form.updateComplete;

    expect(oldStore.getState().data).toEqual(draft);
    expect(oldStoreActions).toEqual(['SET_DATA']);
  });

  it('starts the new form with the data of the new config after a setData call made before the new config', async () => {
    const { form, recorder } = await mountRecordedForm();

    form.setData(draft);
    setConfig(form, recorder.configWith({ data: { firstName: 'Dana' } }));
    await form.updateComplete;

    expect(form.context.store.getState().data).toEqual({ firstName: 'Dana' });
  });

  it('starts the new form with the data of a setData call made after a new validators value', async () => {
    const { form, oldStoreActions, recorder } = await mountRecordedForm();

    form.validators = (validator, localization) => noopValidators(validator, localization);
    form.setData(draft);
    await form.updateComplete;

    expect(form.context.store.getState().data).toEqual(draft);
    expect(oldStoreActions).toEqual([]);
    expect(recorder.actionTypesByStore).toHaveLength(2);
  });

  it('applies a setData call at once when the same config object is assigned again', async () => {
    const { form, oldStoreActions, recorder } = await mountRecordedForm();

    setConfig(form, form.config as unknown as ReturnType<typeof buildConfig>);
    form.setData(draft);

    expect(form.context.store.getState().data).toEqual(draft);
    expect(oldStoreActions).toEqual(['SET_DATA']);
    await form.updateComplete;
    expect(recorder.actionTypesByStore).toHaveLength(1);
  });

  it('starts one time with the last of two configs and applies the last call of each kind made after it', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { form, oldStoreActions, recorder } = await mountRecordedForm();
    const healths = recordEvents<FormHealth>(form, 'formHealth');
    const lastHealth: FormHealth = { status: 'errored', code: 10_005, message: 'last call' };

    setConfig(form, recorder.configWith({ formName: 'first-config' }));
    form.setData({ firstName: 'Between' });
    form.setMeta({ tier: 'between' });
    form.setHealth(callHealth);
    setConfig(form, recorder.configWith({ formName: 'second-config' }));
    form.setData(draft);
    form.setMeta({ tier: 'paid' });
    form.setHealth(lastHealth);
    await form.updateComplete;

    expect(recorder.actionTypesByStore).toHaveLength(2);
    const newStoreActions = recorder.actionTypesByStore[1];
    expect(countOf(newStoreActions, 'INITIALIZE')).toBe(1);
    expect(form.context.store.getState().formName).toBe('second-config');
    expect(form.context.store.getState().data).toEqual(draft);
    expect(form.context.store.getState().meta).toEqual({ tier: 'paid' });
    expect(healths).toEqual([{ status: 'ok' }, lastHealth]);
    expect(oldStoreActions).toEqual([]);
  });

  it('gives the calls made after a new config to the old form when the config becomes undefined in the same task', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { form, oldStoreActions, recorder } = await mountRecordedForm();
    const oldStore = form.context.store;

    setConfig(form, recorder.configWith({ data: { firstName: 'Dana' } }));
    form.setData(draft);
    form.setMeta({ tier: 'paid' });
    form.setHealth(callHealth);
    form.config = undefined as unknown as FormElement['config'];
    await form.updateComplete;

    expect(recorder.actionTypesByStore).toHaveLength(1);
    expect(oldStoreActions).toEqual(['SET_DATA', 'SET_META', 'SET_FORM_HEALTH']);
    expect(oldStore.getState().data).toEqual(draft);
    expect(oldStore.getState().meta).toEqual({ tier: 'paid' });
    expect(oldStore.getState().formHealth).toEqual(callHealth);
  });

  it('applies a later setData call at once after a new config became undefined in the same task', async () => {
    const { form, recorder } = await mountRecordedForm();
    const oldStore = form.context.store;

    setConfig(form, recorder.configWith({ data: { firstName: 'Dana' } }));
    form.setData(draft);
    form.config = undefined as unknown as FormElement['config'];
    await form.updateComplete;
    form.setData({ firstName: 'Later' });

    expect(oldStore.getState().data).toEqual({ firstName: 'Later' });
  });

  it('applies a setData call at once after a formHealth listener assigned another config during the start', async () => {
    const { form, recorder } = await mountRecordedForm();
    form.addEventListener(
      'formHealth',
      () => setConfig(form, recorder.configWith({ formName: 'listener-config' })),
      { once: true, signal: listeners.signal },
    );

    setConfig(form, recorder.configWith({ formName: 'start-config' }));
    await form.updateComplete;
    const storeOfTheStart = form.context.store;
    form.setData(draft);

    expect(storeOfTheStart.getState().data).toEqual(draft);
  });

  it('starts one time with the last config and drops a setData call made for a config that was replaced in the same task', async () => {
    const { form, oldStoreActions, recorder } = await mountRecordedForm();

    setConfig(form, recorder.configWith({ formName: 'customer-b', data: { firstName: 'Bea' } }));
    form.setData(draft);
    setConfig(form, recorder.configWith({ formName: 'customer-c', data: { firstName: 'Cid' } }));
    await form.updateComplete;

    expect(recorder.actionTypesByStore).toHaveLength(2);
    expect(countOf(recorder.actionTypesByStore[1], 'INITIALIZE')).toBe(1);
    expect(form.context.store.getState().formName).toBe('customer-c');
    expect(form.context.store.getState().data).toEqual({ firstName: 'Cid' });
    expect(oldStoreActions).toEqual([]);
  });

  it('starts one time with the last config and drops a setMeta call made for a config that was replaced in the same task', async () => {
    const { form, oldStoreActions, recorder } = await mountRecordedForm();

    setConfig(form, recorder.configWith({ meta: { tier: 'free' } }));
    form.setMeta({ tier: 'paid' });
    setConfig(form, recorder.configWith({ meta: { tier: 'trial' } }));
    await form.updateComplete;

    expect(recorder.actionTypesByStore).toHaveLength(2);
    expect(form.context.store.getState().meta).toEqual({ tier: 'trial' });
    expect(oldStoreActions).toEqual([]);
  });

  it('starts one time with the last config and drops a setHealth call made for a config that was replaced in the same task', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { form, oldStoreActions, recorder } = await mountRecordedForm();
    const healths = recordEvents<FormHealth>(form, 'formHealth');

    setConfig(form, recorder.configWith());
    form.setHealth(callHealth);
    setConfig(form, recorder.configWith());
    await form.updateComplete;

    expect(recorder.actionTypesByStore).toHaveLength(2);
    expect(healths).toEqual([{ status: 'ok' }]);
    expect(oldStoreActions).toEqual([]);
  });

  it('starts one time with the new config and the data of a setData call when a new validators value follows the call', async () => {
    const { form, oldStoreActions, recorder } = await mountRecordedForm();

    setConfig(form, recorder.configWith({ formName: 'customer-b', data: { firstName: 'Bea' } }));
    form.setData(draft);
    form.validators = (validator, localization) => noopValidators(validator, localization);
    await form.updateComplete;

    expect(recorder.actionTypesByStore).toHaveLength(2);
    expect(countOf(recorder.actionTypesByStore[1], 'INITIALIZE')).toBe(1);
    expect(form.context.store.getState().formName).toBe('customer-b');
    expect(form.context.store.getState().data).toEqual(draft);
    expect(oldStoreActions).toEqual([]);
  });
});

describe('the health of a form whose condition fails with the config data', () => {
  const brokenConditionFormDef = {
    form: {
      uid: 'root',
      kind: 'layout',
      type: 'flex',
      children: [
        {
          kind: 'input',
          type: 'textinput',
          path: 'firstName',
          include: { when: '$form.missing.deep === 1' },
        },
      ],
    },
  };

  it('dispatches the error of the condition as the first event', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const healths = recordEvents<FormHealth>(document.body, 'formHealth');

    await mountForm({ ...buildConfig(), formDef: brokenConditionFormDef });

    expect(healths[0]).toMatchObject({ status: 'errored', code: 11 });
  });
});

describe('an exception during the start', () => {
  class FormThatKeepsStartErrors extends FormElement {
    startErrors: unknown[] = [];

    // Lit turns an exception of willUpdate into a rejected updateComplete and throws it again as
    // an unhandled rejection at the next update. This subclass keeps it for the spec instead.
    override willUpdate(changed: Map<string, unknown>) {
      try {
        super.willUpdate(changed);
      } catch (error) {
        this.startErrors.push(error);
      }
    }
  }
  safeDefine('form-element-spec-start-error', FormThatKeepsStartErrors);

  it('applies and dispatches a setHealth call made after a middleware threw during the start', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const middlewareError = new Error('The middleware failed');
    const laterHealth: FormHealth = { status: 'errored', code: 10_003, message: 'later call' };
    const form = document.createElement(
      'form-element-spec-start-error',
    ) as FormThatKeepsStartErrors;
    form.validators = noopValidators;
    setConfig(form, {
      ...buildConfig(),
      middlewares: [
        () => (next) => (action) => {
          if (action.type === 'SET_DATA') {
            throw middlewareError;
          }
          return next(action);
        },
      ],
    });
    const healths = recordEvents<FormHealth>(form, 'formHealth');
    await startForm(form);

    form.setHealth(laterHealth);

    expect(form.startErrors).toEqual([middlewareError]);
    expect(form.context.store.getState().formHealth).toEqual(laterHealth);
    expect(healths.at(-1)).toEqual(laterHealth);
  });
});

describe('a new config whose start throws', () => {
  class FormThatKeepsUpdateErrors extends FormElement {
    updateErrors: unknown[] = [];

    // The exception still leaves willUpdate, so Lit skips the render as in an app. Lit would
    // reject updateComplete and throw the error again at the next update. This keeps it instead.
    protected override scheduleUpdate() {
      try {
        super.scheduleUpdate();
      } catch (error) {
        this.updateErrors.push(error);
      }
    }
  }
  safeDefine('form-element-spec-update-error', FormThatKeepsUpdateErrors);

  /** A config whose middleware throws for one action type and counts the stores it is part of. */
  const configThatThrowsOn = (actionType: string, middlewareError: Error) => {
    const counts = { stores: 0, initializeActions: 0 };
    const config = {
      ...buildConfig(),
      middlewares: [
        () => {
          counts.stores += 1;
          return (next: (action: Action) => void) => (action: Action) => {
            if (action.type === 'INITIALIZE') {
              counts.initializeActions += 1;
            }
            if (action.type === actionType) {
              throw middlewareError;
            }
            return next(action);
          };
        },
      ],
    } as ReturnType<typeof buildConfig>;
    return { config, counts };
  };

  async function mountFormThatKeepsUpdateErrors() {
    const form = document.createElement(
      'form-element-spec-update-error',
    ) as FormThatKeepsUpdateErrors;
    form.validators = noopValidators;
    setConfig(form, buildConfig());
    await startForm(form);
    await vi.waitFor(() => expect(form.querySelector('gui-stub-flex')).not.toBeNull());
    return { form, oldRoot: form.querySelector('gui-stub-flex') as HTMLElement };
  }

  it('replaces the widgets of the old store with the root widget of the new store when a middleware throws during SET_DATA', async () => {
    const { form, oldRoot } = await mountFormThatKeepsUpdateErrors();
    const middlewareError = new Error('SET_DATA failed');
    const { config, counts } = configThatThrowsOn('SET_DATA', middlewareError);

    setConfig(form, config);

    await vi.waitFor(() => {
      const root = form.querySelector('gui-stub-flex');
      expect(root).not.toBeNull();
      expect(root).not.toBe(oldRoot);
    });
    expect(form.contains(oldRoot)).toBe(false);
    expect(form.updateErrors).toEqual([middlewareError]);
    expect(counts).toEqual({ stores: 1, initializeActions: 1 });
  });

  it('removes the widgets of the old store when a middleware throws during INITIALIZE', async () => {
    // Before INITIALIZE the store holds an empty `grid` root, and the stub loaders have no `grid`.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { form, oldRoot } = await mountFormThatKeepsUpdateErrors();
    const middlewareError = new Error('INITIALIZE failed');
    const { config, counts } = configThatThrowsOn('INITIALIZE', middlewareError);

    setConfig(form, config);

    await vi.waitFor(() => expect(form.contains(oldRoot)).toBe(false));
    expect(form.updateErrors).toEqual([middlewareError]);
    expect(counts).toEqual({ stores: 1, initializeActions: 1 });
  });
});

describe('a custom form health boundary', () => {
  it('receives the health and the form, and keeps the form mounted', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const receivedHealths: FormHealth[] = [];
    const customBoundary: FormHealthBoundary = ({ health, form }) => {
      receivedHealths.push(health);
      return html`<section class="custom-boundary">
        ${health.status === 'errored'
          ? html`<p class="custom-error">${health.message}</p>`
          : nothing}
        ${form}
      </section>`;
    };
    const form = await mountForm(buildConfig(), customBoundary);
    const formElement = form.querySelector('.custom-boundary form');
    expect(formElement).not.toBeNull();
    expect(receivedHealths.at(-1)).toEqual({ status: 'ok' });

    setErroredHealth(form, 'custom boundary');
    await form.updateComplete;

    expect(receivedHealths.at(-1)).toEqual({
      status: 'errored',
      message: 'custom boundary',
      code: 1,
    });
    expect(form.querySelector('.custom-error')?.textContent).toBe('custom boundary');
    expect(form.querySelector('.custom-boundary form')).toBe(formElement);
    expect(form.querySelector('.gui-form-health-error')).toBeNull();
  });
});
