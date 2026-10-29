// @vitest-environment jsdom
import {
  type FormEvent,
  type FormHealth,
  type FormInitConfig,
  type I18nTranslator,
  type WithWidget,
} from '@golemui/core';
import { type Component, createApp, defineComponent, h } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FormComponent from './FormComponent.vue';
import {
  buildConfig,
  composableOutputs,
  type InputComposableOutput,
  lastComposableOutput,
  noopValidators,
  stubWidgetLoaders,
} from './ssr.fixture';

type StubComponent = Component<WithWidget>;

const SlowWidget = defineComponent({
  name: 'SlowWidget',
  props: { widget: { type: Object, required: true } },
  render: () => h('span', { class: 'slow-widget' }),
}) as StubComponent;

/** A widget loader that resolves only when the test says so. */
function deferredLoader() {
  const loader = {
    started: false,
    resolve: (_component: StubComponent) => undefined as void,
    load: () =>
      new Promise<StubComponent>((resolve) => {
        loader.started = true;
        loader.resolve = resolve;
      }),
  };
  return loader;
}

/** A new loader function per test, because the widget registry caches a load by its loader. */
const configWithSlowWidget = (
  load: () => Promise<StubComponent>,
): FormInitConfig<StubComponent> => ({
  formDef: {
    form: {
      uid: 'root',
      kind: 'layout',
      type: 'flex',
      children: [{ uid: 'slow', kind: 'input', type: 'slow', path: 'slow' }],
    },
  },
  widgetLoaders: { ...stubWidgetLoaders, slow: load },
});

const configWithChangeEvent = (): FormInitConfig<StubComponent> => ({
  formDef: {
    form: {
      uid: 'root',
      kind: 'layout',
      type: 'flex',
      children: [
        {
          uid: 'firstName',
          kind: 'input',
          type: 'textinput',
          path: 'firstName',
          on: { change: 'firstNameChanged' },
        },
      ],
    },
  },
  widgetLoaders: stubWidgetLoaders,
  data: { firstName: 'Ada' },
});

let container: HTMLDivElement;
let unmount: () => void = () => undefined;
let consoleError: ReturnType<typeof vi.spyOn>;
let consoleWarn: ReturnType<typeof vi.spyOn>;

const mountForm = (props: Record<string, unknown>) => {
  const app = createApp({ render: () => h(FormComponent, props) });
  app.mount(container);
  let isUnmounted = false;
  unmount = () => {
    if (!isUnmounted) {
      isUnmounted = true;
      app.unmount();
    }
  };
};

beforeEach(() => {
  composableOutputs.length = 0;
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  unmount();
  unmount = () => undefined;
  container.remove();
  vi.restoreAllMocks();
});

describe('a widget load that ends after the form unmounts', () => {
  it('renders the widget when the load resolves while the form is mounted', async () => {
    const loader = deferredLoader();
    mountForm({ config: configWithSlowWidget(loader.load), validators: noopValidators });
    await vi.waitFor(() => expect(loader.started).toBe(true));

    loader.resolve(SlowWidget);

    await vi.waitFor(() => expect(container.querySelector('.slow-widget')).not.toBeNull());
  });

  it('logs no error and no warning when the load resolves after the unmount', async () => {
    const loader = deferredLoader();
    mountForm({ config: configWithSlowWidget(loader.load), validators: noopValidators });
    await vi.waitFor(() => expect(loader.started).toBe(true));
    unmount();

    loader.resolve(SlowWidget);
    // Gives the resolved load time to run its continuation.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
  });
});

describe('the host listeners after the form unmounts', () => {
  it('get no form event and no health for a widget call or an event callback', async () => {
    const formEvent = vi.fn<(event: FormEvent) => void>();
    const formHealth = vi.fn<(health: FormHealth) => void>();
    mountForm({
      config: configWithChangeEvent(),
      validators: noopValidators,
      onFormEvent: formEvent,
      onFormHealth: formHealth,
    });
    await vi.waitFor(() => expect(container.querySelector('input')).not.toBeNull());
    const firstName = lastComposableOutput<InputComposableOutput<string>>('firstName');
    firstName.onValueChanged('Grace');
    expect(formEvent).toHaveBeenCalledTimes(1);
    const event = formEvent.mock.calls[0][0];
    const healthCallsBeforeUnmount = formHealth.mock.calls.length;

    unmount();
    firstName.onValueChanged('Linus');
    event.callback({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: { uid: 'firstName', prop: 'label', value: 'Name' },
    });

    expect(formEvent).toHaveBeenCalledTimes(1);
    expect(formHealth).toHaveBeenCalledTimes(healthCallsBeforeUnmount);
  });
});

describe('the translator listener', () => {
  it('is added once on mount and removed on unmount', () => {
    const unsubscribe = vi.fn();
    const translator: I18nTranslator = {
      lang: 'en',
      translate: (key, _params, defaultValue) => defaultValue ?? key,
      subscribe: vi.fn(() => unsubscribe),
    };
    mountForm({
      config: { ...buildConfig(), localization: translator },
      validators: noopValidators,
    });

    expect(translator.subscribe).toHaveBeenCalledTimes(1);
    expect(unsubscribe).not.toHaveBeenCalled();

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
