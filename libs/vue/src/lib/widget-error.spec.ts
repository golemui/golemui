// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- the spec defines the widgets that throw next to the form host. */
import {
  enableDevMode,
  type FormInitConfig,
  type FormSubmitEvent,
  preloadFormWidgets,
  type WithWidget,
} from '@golemui/core';
import { type App, type Component, createApp, defineComponent, h, nextTick } from 'vue';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import FormComponent from './FormComponent.vue';
import {
  type InputComposableOutput,
  lastComposableOutput,
  noopValidators,
  stubWidgetLoaders,
} from './ssr.fixture';

type StubComponent = Component<WithWidget>;

const ThrowsInSetup = defineComponent({
  name: 'ThrowsInSetup',
  props: { widget: { type: Object, required: true } },
  setup() {
    throw new Error('setup failed');
  },
});

const ThrowsInRender = defineComponent({
  name: 'ThrowsInRender',
  props: { widget: { type: Object, required: true } },
  setup() {
    return () => {
      throw new Error('render failed');
    };
  },
});

const widgetLoaders = {
  ...stubWidgetLoaders,
  throwsInSetup: async (): Promise<StubComponent> => ThrowsInSetup as StubComponent,
  throwsInRender: async (): Promise<StubComponent> => ThrowsInRender as StubComponent,
};

const rootLayout = (children: unknown[]) => ({
  form: { uid: 'root', kind: 'layout', type: 'flex', children },
});

const firstNameInput = { uid: 'firstName', kind: 'input', type: 'textinput', path: 'firstName' };

let app: App | null = null;
let container: HTMLDivElement;

const mountForm = async (
  config: FormInitConfig<StubComponent>,
  onSubmit: (event: FormSubmitEvent) => void = () => undefined,
) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  app = createApp({
    setup: () => () =>
      h(FormComponent, { config, validators: noopValidators, onFormSubmit: onSubmit }),
  });
  app.mount(container);
  await nextTick();
};

const firstNameValue = () =>
  container.querySelector<HTMLInputElement>('input[name="firstName"]')?.value;

const setFirstNameValue = async (value: string) => {
  lastComposableOutput<InputComposableOutput<string>>('firstName').onValueChanged(value);
  await nextTick();
};

beforeAll(async () => {
  await preloadFormWidgets({ widgetLoaders });
});

beforeEach(() => {
  // The error boundary logs the caught error, which is expected here.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  // Vue warns that a component whose setup threw has no render function.
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  app?.unmount();
  app = null;
  container.remove();
  vi.restoreAllMocks();
});

describe('a widget that throws', () => {
  it.each([
    ['in setup', 'throwsInSetup', 'setup failed'],
    ['while rendering', 'throwsInRender', 'render failed'],
  ])(
    '%s renders the fallback with the widget type, the uid and the message',
    async (_when, type, message) => {
      await mountForm({
        formDef: rootLayout([
          { uid: 'broken', kind: 'input', type, path: 'broken' },
          firstNameInput,
        ]),
        widgetLoaders,
        data: { firstName: 'Ada' },
      });

      const formText = container.querySelector('form')?.textContent;
      expect(formText).toContain(`Component ${type}[broken] failed with:`);
      expect(formText).toContain(message);
    },
  );

  it('keeps its sibling rendered, and the sibling takes a new value', async () => {
    await mountForm({
      formDef: rootLayout([
        { uid: 'broken', kind: 'input', type: 'throwsInRender', path: 'broken' },
        firstNameInput,
      ]),
      widgetLoaders,
      data: { firstName: 'Ada' },
    });
    expect(firstNameValue()).toBe('Ada');

    await setFirstNameValue('Grace');

    expect(firstNameValue()).toBe('Grace');
  });
});

describe('a widget that fails to load', () => {
  it('lets its sibling take a new value, and the form submits it', async () => {
    const submits: FormSubmitEvent[] = [];
    await mountForm(
      {
        formDef: rootLayout([
          { uid: 'missing', kind: 'input', type: 'missing', path: 'missing' },
          firstNameInput,
        ]),
        widgetLoaders: {
          ...widgetLoaders,
          missing: () => Promise.reject(new Error('The import failed')),
        },
        data: { firstName: 'Ada' },
      },
      (event) => submits.push(event),
    );
    await vi.waitFor(() =>
      expect(container.querySelector('.gui-form-health-error')?.textContent).toContain(
        '[30] Widget "missing" could not be loaded',
      ),
    );

    await setFirstNameValue('Grace');
    container.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(firstNameValue()).toBe('Grace');
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
    // The store subscription of the widget throws, and rxjs throws the error again in a timer.
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    await mountForm({
      formDef: rootLayout([
        {
          uid: 'lastName',
          kind: 'input',
          type: 'textinput',
          path: 'lastName',
          props: { path: 'x' },
        },
        firstNameInput,
      ]),
      widgetLoaders,
      data: { firstName: 'Ada', lastName: 'Lovelace' },
    });

    expect(() => vi.runOnlyPendingTimers()).toThrow(
      '[GolemUI] Widget "lastName": prop keys [path] collide with widget fields',
    );
    expect(container.querySelector('form')?.textContent).not.toContain('failed with:');
    expect(container.querySelector<HTMLInputElement>('input[name="lastName"]')?.value).toBe(
      'Lovelace',
    );
    expect(firstNameValue()).toBe('Ada');
  });
});
