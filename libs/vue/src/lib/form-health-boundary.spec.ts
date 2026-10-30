// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- the spec defines a custom boundary next to the form host. */
import {
  type FormHealth,
  type FormInitConfig,
  preloadFormWidgets,
  type WithWidget,
} from '@golemui/core';
import {
  type App,
  type Component,
  createApp,
  defineComponent,
  h,
  nextTick,
  type ShallowRef,
  shallowRef,
} from 'vue';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import FormComponent from './FormComponent.vue';
import type { FormHealthBoundaryProps } from './FormComponent.types';
import { buildConfig, noopValidators, stubWidgetLoaders } from './ssr.fixture';

type StubConfig = FormInitConfig<Component<WithWidget>>;

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

const erroredConfig = (): StubConfig => ({ ...buildConfig(), formDef: duplicateUidFormDef });

let app: App | null = null;
let container: HTMLDivElement;

/** Mounts the form with its config in a shallow ref, so a test can replace the whole config. */
const mountForm = async (
  initialConfig: StubConfig,
  extraProps: Record<string, unknown> = {},
): Promise<ShallowRef<StubConfig>> => {
  const config = shallowRef(initialConfig);
  container = document.createElement('div');
  document.body.appendChild(container);
  app = createApp({
    setup: () => () =>
      h(FormComponent, { config: config.value, validators: noopValidators, ...extraProps }),
  });
  app.mount(container);
  await nextTick();
  return config;
};

beforeAll(async () => {
  await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
});

beforeEach(() => {
  // The errored health is logged, which is expected here.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  app?.unmount();
  app = null;
  container.remove();
  vi.restoreAllMocks();
});

describe('the health of a form with an invalid definition', () => {
  it('reports only the errored health at mount', async () => {
    const healths: FormHealth[] = [];

    await mountForm(erroredConfig(), {
      onFormHealth: (health: FormHealth) => healths.push(health),
    });

    expect(healths).toEqual([duplicateUidHealth]);
  });

  it('shows the default banner as an alert with the message', async () => {
    await mountForm(erroredConfig());

    const banner = container.querySelector('.gui-form-health-error');
    expect(banner?.getAttribute('role')).toBe('alert');
    expect(banner?.textContent).toContain(duplicateUidHealth.message);
  });

  it('removes the default banner when a new config has a valid definition', async () => {
    const config = await mountForm(erroredConfig());
    expect(container.querySelector('.gui-form-health-error')).not.toBeNull();

    config.value = buildConfig();
    await nextTick();

    expect(container.querySelector('.gui-form-health-error')).toBeNull();
    expect(container.querySelector<HTMLInputElement>('input[name="firstName"]')?.value).toBe('Ada');
  });
});

describe('a custom form health boundary', () => {
  it('receives the health and keeps the form mounted', async () => {
    const receivedHealths: FormHealth[] = [];
    const CustomBoundary = defineComponent({
      name: 'CustomBoundary',
      props: { health: { type: Object, required: true } },
      setup(props: FormHealthBoundaryProps, { slots }) {
        return () => {
          receivedHealths.push(props.health);
          return h('section', { class: 'custom-boundary' }, [
            props.health.status === 'errored'
              ? h('p', { class: 'custom-error' }, props.health.message)
              : null,
            slots.default?.(),
          ]);
        };
      },
    });
    const config = await mountForm(buildConfig(), { formHealthBoundary: CustomBoundary });
    const form = container.querySelector('.custom-boundary form');
    expect(form).not.toBeNull();
    expect(receivedHealths.at(-1)).toEqual({ status: 'ok' });

    config.value = erroredConfig();
    await nextTick();

    expect(receivedHealths.at(-1)).toEqual(duplicateUidHealth);
    expect(container.querySelector('.custom-error')?.textContent).toBe(duplicateUidHealth.message);
    expect(container.querySelector('.custom-boundary form')).toBe(form);
    expect(container.querySelector('.gui-form-health-error')).toBeNull();
  });
});
