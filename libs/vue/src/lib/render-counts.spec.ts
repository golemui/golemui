// @vitest-environment jsdom
import {
  type FormInitConfig,
  identityTranslator,
  preloadFormWidgets,
  type WithWidget,
} from '@golemui/core';
import { type App, type Component, createApp, h, nextTick, ref } from 'vue';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import FormComponent from './FormComponent.vue';
import type { FormComponentHandle } from './FormComponent.types';
import {
  type InputComposableOutput,
  composableOutputs,
  lastComposableOutput,
  noopValidators,
  stubWidgetLoaders,
} from './ssr.fixture';

/**
 * Counts the renders of each widget after one store change, with a real store and the stub
 * widgets of the fixture. The counts are exact, so a change of the render behavior shows as a
 * changed number.
 *
 * Run: npx vitest run --config libs/vue/vite.config.ts src/lib/render-counts.spec.ts
 */

type StubComponent = Component<WithWidget>;

const rootLayout = (children: unknown[]) => ({
  form: { uid: 'root', kind: 'layout', type: 'flex', children },
});

const textInput = (uid: string, extra: Record<string, unknown> = {}) => ({
  uid,
  kind: 'input',
  type: 'textinput',
  path: uid,
  ...extra,
});

const usersRepeater = {
  uid: 'users',
  kind: 'input',
  type: 'repeater',
  path: 'users',
  props: {
    template: {
      uid: 'userRow',
      kind: 'layout',
      type: 'flex',
      children: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'users.items.name' }],
    },
  },
};

const threeUsers = [{ name: 'Ada' }, { name: 'Grace' }, { name: 'Linus' }];

let app: App | null = null;
let container: HTMLDivElement | null = null;

const mountForm = async (config: FormInitConfig<StubComponent>) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  const formHandle = ref<FormComponentHandle | null>(null);
  app = createApp({
    setup: () => () => h(FormComponent, { ref: formHandle, config, validators: noopValidators }),
  });
  app.mount(container);
  await nextTick();
  const mountedFormHandle = () => {
    if (!formHandle.value) {
      throw new Error('The form handle is not set');
    }
    return formHandle.value;
  };
  return {
    setData: async (data: Record<string, unknown>) => {
      mountedFormHandle().setData(data);
      await nextTick();
    },
    setMeta: async (meta: Record<string, unknown>) => {
      mountedFormHandle().setMeta(meta);
      await nextTick();
    },
  };
};

const typeInto = async (uid: string, value: string) => {
  lastComposableOutput<InputComposableOutput<string>>(uid).onValueChanged(value);
  await nextTick();
};

const setLanguage = async (translator: ReturnType<typeof identityTranslator>, lang: string) => {
  translator.setLang(lang);
  await nextTick();
};

let firstCountedRecord = 0;

/** Counts only the renders recorded after this call. */
const startCounting = () => {
  firstCountedRecord = composableOutputs.length;
};

/** @returns The number of renders per widget uid since `startCounting`. */
const rendersSinceStart = () => {
  const renders: Record<string, number> = {};
  for (const record of composableOutputs.slice(firstCountedRecord)) {
    renders[record.uid] = (renders[record.uid] ?? 0) + 1;
  }
  return renders;
};

beforeAll(async () => {
  // Preloaded widgets render in the first render, so no spec waits for a dynamic import.
  await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
});

afterEach(() => {
  app?.unmount();
  app = null;
  container?.remove();
  container = null;
  composableOutputs.length = 0;
  firstCountedRecord = 0;
});

describe('render counts', () => {
  const threeInputs = (extra: Record<string, unknown> = {}) => ({
    formDef: rootLayout([textInput('a'), textInput('b'), textInput('c', extra)]),
    widgetLoaders: stubWidgetLoaders,
    data: { a: 'A', b: 'B', c: 'C' },
  });

  it('renders every input once on the first change, because the form becomes touched', async () => {
    await mountForm(threeInputs());
    startCounting();

    await typeInto('a', 'AB');

    expect(rendersSinceStart()).toEqual({ a: 1, b: 1, c: 1 });
  });

  it('renders only the changed input on a later change', async () => {
    await mountForm(threeInputs());
    await typeInto('a', 'AB');
    startCounting();

    await typeInto('a', 'ABC');

    expect(rendersSinceStart()).toEqual({ a: 1 });
  });

  it('renders only the input whose value setData changes', async () => {
    const { setData } = await mountForm(threeInputs());
    startCounting();

    await setData({ a: 'A', b: 'B2', c: 'C' });

    expect(rendersSinceStart()).toEqual({ b: 1 });
  });

  it('renders no widget when setMeta changes a key that no widget reads', async () => {
    const { setMeta } = await mountForm(threeInputs({ label: '{{$meta.title}}' }));
    startCounting();

    await setMeta({ unread: 1 });

    expect(rendersSinceStart()).toEqual({});

    await setMeta({ title: 'Title' });

    expect(rendersSinceStart()).toEqual({ c: 1 });
  });

  it('renders the repeater, every row layout and only the changed input when one row changes', async () => {
    await mountForm({
      formDef: rootLayout([usersRepeater]),
      widgetLoaders: stubWidgetLoaders,
      data: { users: threeUsers },
    });
    // The first change touches the form, which renders every input once.
    await typeInto('name[1]', 'Grace H');
    startCounting();

    await typeInto('name[1]', 'Grace Ho');

    // The repeater gives every row layout a new widget object, but the inputs of the other rows
    // keep theirs.
    expect(rendersSinceStart()).toEqual({
      users: 1,
      'userRow[0]': 1,
      'userRow[1]': 1,
      'name[1]': 1,
      'userRow[2]': 1,
    });
  });

  it('renders every widget once when the language changes', async () => {
    const translator = identityTranslator('en-US');
    await mountForm({
      formDef: rootLayout([textInput('a'), textInput('b'), usersRepeater]),
      widgetLoaders: stubWidgetLoaders,
      data: { a: 'A', b: 'B', users: threeUsers.slice(0, 2) },
      localization: translator,
    });
    startCounting();

    await setLanguage(translator, 'es');

    expect(rendersSinceStart()).toEqual({
      root: 1,
      a: 1,
      b: 1,
      users: 1,
      'userRow[0]': 1,
      'name[0]': 1,
      'userRow[1]': 1,
      'name[1]': 1,
    });
  });
});

describe('a layout child', () => {
  it('does not render again when its layout renders for a sibling that is hidden', async () => {
    const { setData } = await mountForm({
      formDef: rootLayout([
        textInput('a'),
        textInput('b'),
        textInput('hidden', { exclude: { when: '$form.hide === true' } }),
      ]),
      widgetLoaders: stubWidgetLoaders,
      data: { a: 'A', b: 'B' },
    });
    startCounting();

    await setData({ a: 'A', b: 'B', hide: true });

    // Vue skips a child whose props keep the same values, so a and b got the same widget object.
    expect(rendersSinceStart()).toEqual({ root: 1 });
  });
});
