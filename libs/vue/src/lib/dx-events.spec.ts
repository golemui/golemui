// @vitest-environment jsdom
import { type FormEvent } from '@golemui/core';
import type { ResolveFormInputFn } from '@golemui/dx';
import { createApp, h } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFormComponent } from './createFormComponent';
import {
  composableOutputs,
  type InputComposableOutput,
  lastComposableOutput,
  noopValidators,
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

let container: HTMLDivElement;
let unmount: () => void = () => undefined;

const mountWidgetSetForm = async (
  resolveFormInput: ResolveFormInputFn,
  props: Record<string, unknown> = {},
) => {
  const WidgetSetForm = createFormComponent({
    widgetLoaders: stubWidgetLoaders,
    validators: () => noopValidators,
    resolveFormInput,
  });
  const app = createApp({
    render: () =>
      h(WidgetSetForm, { config: { formDef: {}, data: { firstName: 'Ada' } }, ...props }),
  });
  app.mount(container);
  unmount = () => app.unmount();
  await vi.waitFor(() => expect(container.querySelector('input')).not.toBeNull());
};

beforeEach(() => {
  composableOutputs.length = 0;
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  unmount();
  unmount = () => undefined;
  container.remove();
});

describe('a form event of a widget set form with a resolved event handler', () => {
  it('calls the resolved handler first and then the form-event listener, with the same event object', async () => {
    const calls: { source: string; event: FormEvent }[] = [];
    // Stands in for the resolver of a widget set with a builder API, which returns the
    // function handlers of the form as `formEvent`.
    await mountWidgetSetForm(
      () => ({
        formDef: formDefWithChangeEvent,
        formEvent: (event) => calls.push({ source: 'resolved', event }),
      }),
      { onFormEvent: (event: FormEvent) => calls.push({ source: 'host', event }) },
    );

    lastComposableOutput<InputComposableOutput<string>>('firstName').onValueChanged('Grace');

    expect(calls.map((call) => call.source)).toEqual(['resolved', 'host']);
    expect(calls[1].event).toBe(calls[0].event);
    expect(calls[0].event).toMatchObject({
      name: 'firstNameChanged',
      data: { firstName: 'Grace' },
    });
  });

  it('calls the resolved handler when no form-event listener is passed', async () => {
    const resolvedHandler = vi.fn();
    await mountWidgetSetForm(() => ({
      formDef: formDefWithChangeEvent,
      formEvent: resolvedHandler,
    }));

    lastComposableOutput<InputComposableOutput<string>>('firstName').onValueChanged('Grace');

    expect(resolvedHandler).toHaveBeenCalledTimes(1);
  });
});
