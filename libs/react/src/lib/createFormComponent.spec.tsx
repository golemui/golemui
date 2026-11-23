// @vitest-environment jsdom
import { preloadFormWidgets } from '@golemui/core';
import { act, type ReactNode, useEffect, useMemo, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFormComponent } from './createFormComponent';
import { type FormComponentHandle } from './FormComponent';
import {
  hookOutputs,
  type InputHookOutput,
  lastHookOutput,
  noopValidators,
  type StoreRecorder,
  storeRecorder,
  stubWidgetLoaders,
} from './ssr.fixture';

const formDefWithChangeEvent = {
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
};

let root: Root;
let container: HTMLDivElement;

const render = (element: ReactNode) => act(async () => root.render(element));

beforeAll(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
});

beforeEach(() => {
  hookOutputs.length = 0;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe('a form event of a widget set form', () => {
  it('calls formEvent one time with the event of the widget', async () => {
    const formEvent = vi.fn();
    const WidgetSetForm = createFormComponent({
      widgetLoaders: stubWidgetLoaders,
      validators: () => noopValidators,
    });

    await render(
      <WidgetSetForm
        config={{ formDef: formDefWithChangeEvent, data: { firstName: 'Ada' } }}
        formEvent={formEvent}
      />,
    );
    await act(async () =>
      lastHookOutput<InputHookOutput<string>>('firstName').onValueChanged('Grace'),
    );

    expect(formEvent).toHaveBeenCalledTimes(1);
    expect(formEvent.mock.calls[0][0]).toMatchObject({
      name: 'firstNameChanged',
      data: { firstName: 'Grace' },
    });
  });
});

describe('a widget set form with a new config object', () => {
  it('shows the draft that a useEffect of the host sets with setData after the new config', async () => {
    const WidgetSetForm = createFormComponent({
      widgetLoaders: stubWidgetLoaders,
      validators: () => noopValidators,
    });
    const oldStores = storeRecorder();
    const newStores = storeRecorder();
    const customerConfig = (customer: string, stores: StoreRecorder) => ({
      formDef: formDefWithChangeEvent,
      data: { firstName: customer },
      middlewares: [stores.middleware],
    });
    function Host({
      config,
      draft,
    }: {
      config: ReturnType<typeof customerConfig>;
      draft?: Record<string, unknown>;
    }) {
      const formRef = useRef<FormComponentHandle>(null);
      useEffect(() => {
        if (draft) {
          formRef.current?.setData(draft);
        }
      }, [config, draft]);
      return <WidgetSetForm ref={formRef} config={config} />;
    }
    await render(<Host config={customerConfig('Ada', oldStores)} />);
    const oldStoreActionCount = oldStores.actionsByStore[0].length;

    await render(
      <Host config={customerConfig('Grace', newStores)} draft={{ firstName: 'Linus' }} />,
    );

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Linus');
    expect(oldStores.actionsByStore[0].slice(oldStoreActionCount)).toEqual([]);
    expect(newStores.actionsByStore).toHaveLength(1);
  });
});

describe('getData of a widget set form', () => {
  const WidgetSetForm = createFormComponent({
    widgetLoaders: stubWidgetLoaders,
    validators: () => noopValidators,
  });

  it('returns what the user typed', async () => {
    const formRef: { current: FormComponentHandle | null } = { current: null };
    await render(
      <WidgetSetForm ref={formRef} config={{ formDef: formDefWithChangeEvent, data: {} }} />,
    );

    await act(async () =>
      lastHookOutput<InputHookOutput<string>>('firstName').onValueChanged('Grace'),
    );

    expect(formRef.current?.getData()).toEqual({ firstName: 'Grace' });
  });

  it('returns the data the new form starts with in a useEffect of the host after a new config', async () => {
    const dataInEffect: Record<string, unknown>[] = [];
    function Host({ customer, draft }: { customer: string; draft?: Record<string, unknown> }) {
      const formRef = useRef<FormComponentHandle>(null);
      const config = useMemo(
        () => ({ formDef: formDefWithChangeEvent, data: { firstName: customer } }),
        [customer],
      );
      useEffect(() => {
        const handle = formRef.current;
        if (!handle) {
          return;
        }
        dataInEffect.push(handle.getData());
        if (draft) {
          // A health call before the start is kept, and so is every call after it.
          handle.setHealth({ status: 'ok' });
          handle.setData(draft);
          dataInEffect.push(handle.getData());
        }
      }, [config, draft]);
      return <WidgetSetForm ref={formRef} config={config} />;
    }
    await render(<Host customer="Ada" />);

    await render(<Host customer="Grace" draft={{ firstName: 'Linus' }} />);

    expect(dataInEffect).toEqual([
      { firstName: 'Ada' },
      { firstName: 'Grace' },
      { firstName: 'Linus' },
    ]);
    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Linus');
  });
});
