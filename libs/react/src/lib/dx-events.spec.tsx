// @vitest-environment jsdom
import { type FormEvent, preloadFormWidgets } from '@golemui/core';
import type { ResolveFormInputFn } from '@golemui/dx';
import { act, type ReactNode, useEffect, useRef } from 'react';
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

describe('a form event of a widget set form with a resolved event handler', () => {
  it('calls the resolved handler first and then formEvent, with the same event object', async () => {
    const calls: { source: string; event: FormEvent }[] = [];
    // Stands in for the resolver of a widget set with a builder API, which returns the
    // function handlers of the form as `formEvent`.
    const resolveFormInput: ResolveFormInputFn = () => ({
      formDef: formDefWithChangeEvent,
      formEvent: (event) => calls.push({ source: 'resolved', event }),
    });
    const WidgetSetForm = createFormComponent({
      widgetLoaders: stubWidgetLoaders,
      validators: () => noopValidators,
      resolveFormInput,
    });

    await render(
      <WidgetSetForm
        config={{ formDef: {}, data: { firstName: 'Ada' } }}
        formEvent={(event) => calls.push({ source: 'host', event })}
      />,
    );
    await act(async () =>
      lastHookOutput<InputHookOutput<string>>('firstName').onValueChanged('Grace'),
    );

    expect(calls.map((call) => call.source)).toEqual(['resolved', 'host']);
    expect(calls[1].event).toBe(calls[0].event);
    expect(calls[0].event).toMatchObject({
      name: 'firstNameChanged',
      data: { firstName: 'Grace' },
    });
  });

  it('calls the resolved handler when no formEvent is passed', async () => {
    const resolvedHandler = vi.fn();
    const WidgetSetForm = createFormComponent({
      widgetLoaders: stubWidgetLoaders,
      validators: () => noopValidators,
      resolveFormInput: () => ({ formDef: formDefWithChangeEvent, formEvent: resolvedHandler }),
    });

    await render(<WidgetSetForm config={{ formDef: {}, data: { firstName: 'Ada' } }} />);
    await act(async () =>
      lastHookOutput<InputHookOutput<string>>('firstName').onValueChanged('Grace'),
    );

    expect(resolvedHandler).toHaveBeenCalledTimes(1);
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
