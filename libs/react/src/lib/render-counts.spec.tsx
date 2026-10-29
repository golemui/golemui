// @vitest-environment jsdom
import {
  type FormInitConfig,
  identityTranslator,
  preloadFormWidgets,
  type WithWidget,
} from '@golemui/core';
import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FormComponent, type FormComponentHandle } from './FormComponent';
import {
  type InputHookOutput,
  hookOutputs,
  lastHookOutput,
  noopValidators,
  stubWidgetLoaders,
} from './ssr.fixture';

/**
 * Counts the committed renders of each widget after one store change, with a real store and the
 * stub widgets of the fixture. The counts are exact, so a change of the render behavior shows as
 * a changed number.
 *
 * Run: npx vitest run --config libs/react/vite.config.ts src/lib/render-counts.spec.tsx
 */

type StubComponent = React.ComponentType<WithWidget>;

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

let root: Root | null = null;
let container: HTMLDivElement | null = null;

const mountForm = async (config: FormInitConfig<StubComponent>) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  const mountedRoot = createRoot(container);
  root = mountedRoot;
  const formRef = createRef<FormComponentHandle>();
  await act(async () =>
    mountedRoot.render(<FormComponent ref={formRef} config={config} validators={noopValidators} />),
  );
  const formHandle = () => {
    if (!formRef.current) {
      throw new Error('The form handle is not set');
    }
    return formRef.current;
  };
  return {
    setData: (data: Record<string, unknown>) => act(async () => formHandle().setData(data)),
    setMeta: (meta: Record<string, unknown>) => act(async () => formHandle().setMeta(meta)),
  };
};

const typeInto = (uid: string, value: string) =>
  act(async () => lastHookOutput<InputHookOutput<string>>(uid).onValueChanged(value));

let firstCountedRecord = 0;

/** Counts only the renders recorded after this call. */
const startCounting = () => {
  firstCountedRecord = hookOutputs.length;
};

/** @returns The number of committed renders per widget uid since `startCounting`. */
const rendersSinceStart = () => {
  const renders: Record<string, number> = {};
  for (const record of hookOutputs.slice(firstCountedRecord)) {
    renders[record.uid] = (renders[record.uid] ?? 0) + 1;
  }
  return renders;
};

/** @returns The widget prop of every recorded render of that widget, in render order. */
const widgetPropsOf = (uid: string) =>
  hookOutputs.filter((record) => record.uid === uid).map((record) => record.widget);

beforeAll(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  // Preloaded widgets render in the first commit, so no spec waits for a dynamic import.
  await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
});

afterEach(async () => {
  if (root) {
    const mountedRoot = root;
    await act(async () => mountedRoot.unmount());
  }
  root = null;
  container?.remove();
  container = null;
  hookOutputs.length = 0;
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

  it('renders the repeater and every row once when one row changes', async () => {
    await mountForm({
      formDef: rootLayout([usersRepeater]),
      widgetLoaders: stubWidgetLoaders,
      data: { users: threeUsers },
    });
    // The first change touches the form, which renders every input once.
    await typeInto('name[1]', 'Grace H');
    startCounting();

    await typeInto('name[1]', 'Grace Ho');

    // The repeater value changes, and WidgetRenderer is not memoized, so every row renders again.
    expect(rendersSinceStart()).toEqual({
      users: 1,
      'userRow[0]': 1,
      'name[0]': 1,
      'userRow[1]': 1,
      'name[1]': 1,
      'userRow[2]': 1,
      'name[2]': 1,
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

    await act(async () => translator.setLang('es'));

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

describe('the widget prop of a layout child', () => {
  it('keeps the same object when the layout renders again because a sibling is hidden', async () => {
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

    expect(rendersSinceStart()).toEqual({ root: 1, a: 1, b: 1 });
    for (const uid of ['a', 'b']) {
      const widgetProps = widgetPropsOf(uid);
      expect(widgetProps).toHaveLength(2);
      expect(widgetProps[1]).toBe(widgetProps[0]);
    }
  });

  it('keeps the same object when the layout renders again for a language change', async () => {
    const translator = identityTranslator('en-US');
    await mountForm({
      formDef: rootLayout([textInput('a'), textInput('b')]),
      widgetLoaders: stubWidgetLoaders,
      data: { a: 'A', b: 'B' },
      localization: translator,
    });

    await act(async () => translator.setLang('es'));

    for (const uid of ['root', 'a', 'b']) {
      const widgetProps = widgetPropsOf(uid);
      expect(widgetProps).toHaveLength(2);
      expect(widgetProps[1]).toBe(widgetProps[0]);
    }
  });
});
