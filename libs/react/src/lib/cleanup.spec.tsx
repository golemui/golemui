// @vitest-environment jsdom
import {
  type FormEvent,
  type FormHealth,
  type FormInitConfig,
  type FormSubmitEvent,
  type I18nTranslator,
  preloadFormWidgets,
  type WithWidget,
} from '@golemui/core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormComponent } from './FormComponent';
import {
  buildConfig,
  hookOutputs,
  type InputHookOutput,
  lastHookOutput,
  noopValidators,
  stubWidgetLoaders,
} from './ssr.fixture';

type StubComponent = React.ComponentType<WithWidget>;

function SlowWidget(): ReactNode {
  return <span className="slow-widget" />;
}

/** A widget loader that resolves or rejects only when the test says so. */
function deferredLoader() {
  const loader = {
    started: false,
    resolve: (_component: StubComponent) => undefined as void,
    reject: (_error: Error) => undefined as void,
    load: () =>
      new Promise<StubComponent>((resolve, reject) => {
        loader.started = true;
        loader.resolve = resolve;
        loader.reject = reject;
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

const spyTranslator = () => {
  const unsubscribe = vi.fn();
  const translator: I18nTranslator = {
    lang: 'en',
    translate: (key, _params, defaultValue) => defaultValue ?? key,
    subscribe: vi.fn(() => unsubscribe),
  };
  return { translator, unsubscribe };
};

let root: Root;
let container: HTMLDivElement;
let consoleError: ReturnType<typeof vi.spyOn>;
let isUnmounted = false;

const render = (element: ReactNode) => act(async () => root.render(element));
const unmount = async () => {
  if (isUnmounted) {
    return;
  }
  isUnmounted = true;
  await act(async () => root.unmount());
};

beforeAll(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
});

beforeEach(() => {
  hookOutputs.length = 0;
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  isUnmounted = false;
});

afterEach(async () => {
  await unmount();
  container.remove();
  vi.restoreAllMocks();
});

describe('a widget load that ends after the form unmounts', () => {
  it('renders the widget when the load resolves while the form is mounted', async () => {
    const loader = deferredLoader();
    await render(
      <FormComponent config={configWithSlowWidget(loader.load)} validators={noopValidators} />,
    );
    await vi.waitFor(() => expect(loader.started).toBe(true));

    await act(async () => loader.resolve(SlowWidget));

    expect(container.querySelector('.slow-widget')).not.toBeNull();
  });

  it('logs no error when the load resolves after the unmount', async () => {
    const loader = deferredLoader();
    await render(
      <FormComponent config={configWithSlowWidget(loader.load)} validators={noopValidators} />,
    );
    await vi.waitFor(() => expect(loader.started).toBe(true));
    await unmount();

    await act(async () => loader.resolve(SlowWidget));

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('marks the form as errored when the load fails while the form is mounted', async () => {
    const loader = deferredLoader();
    const healths: FormHealth[] = [];
    await render(
      <FormComponent
        config={configWithSlowWidget(loader.load)}
        validators={noopValidators}
        formHealth={(health) => healths.push(health)}
      />,
    );
    await vi.waitFor(() => expect(loader.started).toBe(true));

    await act(async () => loader.reject(new Error('The module did not load')));

    expect(healths.at(-1)).toEqual({
      status: 'errored',
      message: '[30] Widget "slow" could not be loaded',
      code: 30,
    });
  });

  it('shows no error in the new form when the load fails after a new config', async () => {
    const loader = deferredLoader();
    const healths: FormHealth[] = [];
    const onHealth = (health: FormHealth) => healths.push(health);
    await render(
      <FormComponent
        config={configWithSlowWidget(loader.load)}
        validators={noopValidators}
        formHealth={onHealth}
      />,
    );
    await vi.waitFor(() => expect(loader.started).toBe(true));

    await render(
      <FormComponent config={buildConfig()} validators={noopValidators} formHealth={onHealth} />,
    );
    await act(async () => loader.reject(new Error('The module did not load')));

    expect(healths.at(-1)).toEqual({ status: 'ok' });
    expect(healths.some((health) => health.status === 'errored')).toBe(false);
    expect(container.querySelector('.gui-form-health-error')).toBeNull();
  });
});

describe('the host callbacks after the form unmounts', () => {
  it('sends no form event and no health for a widget call or an event callback', async () => {
    const formEvent = vi.fn<(event: FormEvent) => void>();
    const formHealth = vi.fn<(health: FormHealth) => void>();
    await render(
      <FormComponent
        config={configWithChangeEvent()}
        validators={noopValidators}
        formEvent={formEvent}
        formHealth={formHealth}
      />,
    );
    const firstName = lastHookOutput<InputHookOutput<string>>('firstName');
    await act(async () => firstName.onValueChanged('Grace'));
    expect(formEvent).toHaveBeenCalledTimes(1);
    const event = formEvent.mock.calls[0][0];
    const healthCallsBeforeUnmount = formHealth.mock.calls.length;

    await unmount();
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
  it('is added once on mount and removed on unmount', async () => {
    const { translator, unsubscribe } = spyTranslator();
    await render(
      <FormComponent
        config={{ ...buildConfig(), localization: translator }}
        validators={noopValidators}
      />,
    );

    expect(translator.subscribe).toHaveBeenCalledTimes(1);
    expect(unsubscribe).not.toHaveBeenCalled();

    await unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('a formSubmit prop that changes after the mount', () => {
  it('sends the next submit to the new callback only', async () => {
    const firstSubmit = vi.fn<(event: FormSubmitEvent) => void>();
    const secondSubmit = vi.fn<(event: FormSubmitEvent) => void>();
    const config = buildConfig();
    await render(
      <FormComponent config={config} validators={noopValidators} formSubmit={firstSubmit} />,
    );
    const submit = () => act(async () => container.querySelector('form')?.requestSubmit());

    await submit();
    expect(firstSubmit).toHaveBeenCalledTimes(1);

    await render(
      <FormComponent config={config} validators={noopValidators} formSubmit={secondSubmit} />,
    );
    await submit();

    expect(firstSubmit).toHaveBeenCalledTimes(1);
    expect(secondSubmit).toHaveBeenCalledTimes(1);
    expect(secondSubmit.mock.calls[0][0].data).toEqual({ firstName: 'Ada', lastName: 'Lovelace' });
  });
});
