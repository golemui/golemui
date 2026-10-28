// @vitest-environment jsdom
import { type FormHealth, type FormInitConfig, type WithWidget } from '@golemui/core';
import { type Component, createApp, h, nextTick, shallowRef } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FormComponent from './FormComponent.vue';
import { formData, formDef, noopValidators, stubWidgetLoaders } from './ssr.fixture';

type StubComponent = Component<WithWidget>;

describe('a widget whose load fails', () => {
  let container: HTMLDivElement;
  let consoleError: ReturnType<typeof vi.spyOn>;
  let rejectLoad: (error: Error) => void;
  let unmount: () => void;

  const configWithFailingWidget = (): FormInitConfig<StubComponent> => ({
    formDef: {
      form: {
        uid: 'root',
        kind: 'layout',
        type: 'flex',
        children: [{ kind: 'input', type: 'failing', path: 'lastName', label: 'Last name' }],
      },
    },
    widgetLoaders: {
      ...stubWidgetLoaders,
      failing: () =>
        new Promise<StubComponent>((_resolve, reject) => {
          rejectLoad = reject;
        }),
    },
    data: formData,
  });

  const mountForm = async (initialConfig: FormInitConfig<StubComponent>) => {
    const config = shallowRef(initialConfig);
    const receivedHealths: FormHealth[] = [];
    const app = createApp({
      render: () =>
        h(FormComponent, {
          config: config.value,
          validators: noopValidators,
          onFormHealth: (health: FormHealth) => receivedHealths.push(health),
        }),
    });
    app.mount(container);
    unmount = () => app.unmount();
    // Lets the flex layout load, so the failing widget starts its load.
    await vi.waitFor(() => expect(container.querySelector('.stub-flex')).not.toBeNull());
    return { config, receivedHealths };
  };

  beforeEach(() => {
    // The errored health is logged, which is expected here.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    unmount();
    container.remove();
    consoleError.mockRestore();
  });

  it('marks the form as errored', async () => {
    const { receivedHealths } = await mountForm(configWithFailingWidget());

    rejectLoad(new Error('network error'));

    await vi.waitFor(() =>
      expect(receivedHealths.at(-1)).toMatchObject({ status: 'errored', code: 30 }),
    );
  });

  it('does not mark the form as errored after a new config replaced the widget', async () => {
    const { config, receivedHealths } = await mountForm(configWithFailingWidget());

    config.value = { formDef, widgetLoaders: stubWidgetLoaders, data: formData };
    await nextTick();
    rejectLoad(new Error('network error'));
    // Gives the rejected load time to dispatch its error.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextTick();

    expect(receivedHealths.filter((health) => health.status === 'errored')).toEqual([]);
    expect(container.querySelectorAll('input')).toHaveLength(2);
  });
});
