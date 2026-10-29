// @vitest-environment jsdom
import {
  type FormInitConfig,
  identityTranslator,
  preloadFormWidgets,
  type WithWidget,
} from '@golemui/core';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { FormElement } from './components/form/form.element';
import {
  type InputAdapter,
  afterLitRenderSchedule,
  lastAdapter,
  noopValidators,
  recordedAdapters,
  renderRecords,
  stubWidgetLoaders,
} from './ssr.fixture';
import './components/widget/widget-element';

/**
 * Counts the completed renders of each widget after one store change, with a real store and the
 * stub widgets of the fixture. The counts are exact, so a change of the render behavior shows as
 * a changed number.
 *
 * Run: npx vitest run --config libs/lit/vite.config.ts src/lib/render-counts.spec.ts
 */

type StubConfig = FormInitConfig<WithWidget>;

// The fixture loaders resolve to element classes, the form config expects widget instances.
const loaders = stubWidgetLoaders as unknown as StubConfig['widgetLoaders'];

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

const mountForm = async (config: StubConfig) => {
  const formElement = document.createElement('gui-core-form') as FormElement;
  formElement.validators = noopValidators;
  formElement.config = config;
  document.body.append(formElement);
  await afterLitRenderSchedule();
  return {
    setData: async (data: Record<string, unknown>) => {
      formElement.setData(data);
      await afterLitRenderSchedule();
    },
    setMeta: async (meta: Record<string, unknown>) => {
      formElement.setMeta(meta);
      await afterLitRenderSchedule();
    },
  };
};

const typeInto = async (uid: string, value: string) => {
  lastAdapter<InputAdapter<string>>(uid).valueChanged(value);
  await afterLitRenderSchedule();
};

const setLanguage = async (translator: ReturnType<typeof identityTranslator>, lang: string) => {
  translator.setLang(lang);
  await afterLitRenderSchedule();
};

let firstCountedRecord = 0;

/** Counts only the renders recorded after this call. */
const startCounting = () => {
  firstCountedRecord = renderRecords.length;
};

/** @returns The number of completed renders per widget uid since `startCounting`. */
const rendersSinceStart = () => {
  const renders: Record<string, number> = {};
  for (const record of renderRecords.slice(firstCountedRecord)) {
    renders[record.uid] = (renders[record.uid] ?? 0) + 1;
  }
  return renders;
};

beforeAll(async () => {
  // Preloaded widgets render in the first render, so no spec waits for a dynamic import.
  await preloadFormWidgets({ widgetLoaders: loaders });
});

afterEach(() => {
  document.body.innerHTML = '';
  recordedAdapters.length = 0;
  renderRecords.length = 0;
  firstCountedRecord = 0;
});

describe('render counts', () => {
  const threeInputs = (extra: Record<string, unknown> = {}) => ({
    formDef: rootLayout([textInput('a'), textInput('b'), textInput('c', extra)]),
    widgetLoaders: loaders,
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

  it('renders only the repeater and the changed input when one row changes', async () => {
    await mountForm({
      formDef: rootLayout([usersRepeater]),
      widgetLoaders: loaders,
      data: { users: threeUsers },
    });
    // The first change touches the form, which renders every input once.
    await typeInto('name[1]', 'Grace H');
    startCounting();

    await typeInto('name[1]', 'Grace Ho');

    // A row layout keeps its templateData, and a new widget object alone does not render it.
    expect(rendersSinceStart()).toEqual({ users: 1, 'name[1]': 1 });
  });

  it('renders every widget once when the language changes', async () => {
    const translator = identityTranslator('en-US');
    await mountForm({
      formDef: rootLayout([textInput('a'), textInput('b'), usersRepeater]),
      widgetLoaders: loaders,
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
      widgetLoaders: loaders,
      data: { a: 'A', b: 'B' },
    });
    startCounting();

    await setData({ a: 'A', b: 'B', hide: true });

    // The hidden input can render once more before its element is removed.
    const { hidden, ...renders } = rendersSinceStart();
    expect(renders).toEqual({ root: 1 });
    expect(hidden ?? 0).toBeLessThanOrEqual(1);
  });
});
