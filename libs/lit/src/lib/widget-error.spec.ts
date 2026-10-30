// @vitest-environment jsdom
import {
  enableDevMode,
  type FormInitConfig,
  type FormSubmitEvent,
  preloadFormWidgets,
  type WithWidget,
} from '@golemui/core';
import { LitElement } from 'lit';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormElement } from './components/form/form.element';
import {
  type InputAdapter,
  afterLitRenderSchedule,
  lastAdapter,
  noopValidators,
  stubWidgetLoaders,
} from './ssr.fixture';
import { safeDefine } from '@golemui/lit-utils';
import './components/widget/widget-element';

type StubConfig = FormInitConfig<WithWidget>;

class ThrowsInConstructorElement extends LitElement {
  widget!: WithWidget['widget'];

  constructor() {
    super();
    throw new Error('constructor failed');
  }
}

/** Every update of this element rejects its update promise, which the test reads. */
const renderErrors: unknown[] = [];

class ThrowsInRenderElement extends LitElement {
  widget!: WithWidget['widget'];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.updateComplete.catch((error: unknown) => renderErrors.push(error));
  }

  override render() {
    throw new Error('render failed');
  }
}

safeDefine('gui-throws-in-constructor', ThrowsInConstructorElement);
safeDefine('gui-throws-in-render', ThrowsInRenderElement);

// The fixture loaders resolve to element classes, the form config expects widget instances.
const widgetLoaders = {
  ...stubWidgetLoaders,
  throwsInConstructor: async () => ThrowsInConstructorElement,
  throwsInRender: async () => ThrowsInRenderElement,
} as unknown as StubConfig['widgetLoaders'];

const rootLayout = (children: unknown[]) => ({
  form: { uid: 'root', kind: 'layout', type: 'flex', children },
});

const firstNameInput = { uid: 'firstName', kind: 'input', type: 'textinput', path: 'firstName' };

const configWith = (widget: Record<string, unknown>): StubConfig => ({
  formDef: rootLayout([widget, firstNameInput]),
  widgetLoaders,
  data: { firstName: 'Ada', lastName: 'Lovelace' },
});

let form: FormElement;

const mountForm = async (config: StubConfig) => {
  form = document.createElement('gui-core-form') as FormElement;
  form.validators = noopValidators;
  form.config = config;
  document.body.append(form);
  await afterLitRenderSchedule();
};

const inputValue = (uid: string) => form.querySelector<HTMLInputElement>(`input#${uid}`)?.value;

const setFirstNameValue = async (value: string) => {
  lastAdapter<InputAdapter<string>>('firstName').valueChanged(value);
  await afterLitRenderSchedule();
};

/** Waits until no Lit element in the form has an update pending, also the ones a render adds. */
const updatesOfEveryLevel = async () => {
  const pendingElements = () =>
    ([form, ...form.querySelectorAll('*')] as Partial<LitElement>[]).filter(
      (element) => element.isUpdatePending,
    );
  for (let pending = pendingElements(); pending.length > 0; pending = pendingElements()) {
    await Promise.all(pending.map((element) => element.updateComplete));
  }
};

beforeAll(async () => {
  // The constructor case is not preloaded, like a widget that the browser imports on demand.
  const { throwsInConstructor: _notPreloaded, ...preloadedLoaders } = widgetLoaders;
  await preloadFormWidgets({ widgetLoaders: preloadedLoaders });
});

beforeEach(() => {
  // The failed load is logged, which is expected here.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  renderErrors.length = 0;
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('a widget that throws in its constructor', () => {
  // The constructor runs after the dynamic import, inside the try of the widget element.
  it('is reported as a widget that could not be loaded, and its sibling takes a new value', async () => {
    await mountForm(
      configWith({ uid: 'broken', kind: 'input', type: 'throwsInConstructor', path: 'b' }),
    );
    await vi.waitFor(() =>
      expect(form.querySelector('.gui-form-health-error')?.textContent).toContain(
        '[30] Widget "throwsInConstructor" could not be loaded',
      ),
    );
    expect(form.querySelector('form')?.textContent).not.toContain('failed with:');

    await setFirstNameValue('Grace');

    expect(inputValue('firstName')).toBe('Grace');
  });
});

describe('a widget that throws while rendering', () => {
  it('rejects its own update, shows no fallback, and its sibling takes a new value', async () => {
    await mountForm(
      configWith({ uid: 'broken', kind: 'input', type: 'throwsInRender', path: 'b' }),
    );

    expect(renderErrors).toEqual([new Error('render failed')]);
    expect(form.querySelector('#host-broken')?.innerHTML).toBe('');
    expect(form.querySelector('form')?.textContent).not.toContain('failed with:');
    expect(form.health).toEqual({ status: 'ok' });
    expect(inputValue('firstName')).toBe('Ada');

    await setFirstNameValue('Grace');

    expect(inputValue('firstName')).toBe('Grace');
  });
});

describe('a widget that fails to load', () => {
  it('lets its sibling take a new value, and the form submits it', async () => {
    const submits: FormSubmitEvent[] = [];
    await mountForm({
      formDef: rootLayout([
        { uid: 'missing', kind: 'input', type: 'missing', path: 'missing' },
        firstNameInput,
      ]),
      widgetLoaders: {
        ...widgetLoaders,
        missing: () => Promise.reject(new Error('The import failed')),
      },
      data: { firstName: 'Ada' },
    });
    form.addEventListener('formSubmit', (event) =>
      submits.push((event as CustomEvent<FormSubmitEvent>).detail),
    );
    await vi.waitFor(() =>
      expect(form.querySelector('.gui-form-health-error')?.textContent).toContain(
        '[30] Widget "missing" could not be loaded',
      ),
    );

    await setFirstNameValue('Grace');
    form.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(inputValue('firstName')).toBe('Grace');
    expect(submits).toHaveLength(1);
    expect(submits[0].data).toEqual({ firstName: 'Grace' });
  });
});

// Dev mode cannot be turned off again, so these tests run last in this file.
describe('a widget prop named like a widget field, in dev mode', () => {
  beforeAll(() => {
    enableDevMode();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws the error outside the render, so no fallback shows and the widget renders', async () => {
    // The store subscription of the adapter throws, and rxjs throws the error again in a timer.
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    form = document.createElement('gui-core-form') as FormElement;
    form.validators = noopValidators;
    form.config = configWith({
      uid: 'lastName',
      kind: 'input',
      type: 'textinput',
      path: 'lastName',
      props: { path: 'x' },
    });
    document.body.append(form);
    // vi.waitFor would run the fake timers, so the test waits for the Lit updates instead.
    await updatesOfEveryLevel();
    expect(inputValue('firstName')).toBe('Ada');

    expect(() => vi.runOnlyPendingTimers()).toThrow(
      '[GolemUI] Widget "lastName": prop keys [path] collide with widget fields',
    );
    expect(form.querySelector('form')?.textContent).not.toContain('failed with:');
    expect(form.querySelector('input#lastName')).not.toBeNull();
  });
});
