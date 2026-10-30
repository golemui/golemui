// @vitest-environment jsdom
import { type FormEvent, preloadFormWidgets, type WithWidget } from '@golemui/core';
import type { ResolveFormInputFn } from '@golemui/dx';
import { safeDefine } from '@golemui/lit-utils';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  type InputAdapter,
  lastAdapter,
  noopValidators,
  recordedAdapters,
  stubWidgetLoaders,
} from '../../ssr.fixture';
import type { Type } from '../../utils/type';
import { createFormComponent, type WidgetSetFormElement } from './createFormComponent';

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

let resolvedHandler: (event: FormEvent) => void = () => undefined;

// Stands in for the resolver of a widget set with a builder API, which returns the function
// handlers of the form as `formEvent`.
const resolveFormInput: ResolveFormInputFn = () => ({
  formDef: formDefWithChangeEvent,
  formEvent: (event) => resolvedHandler(event),
});

const WidgetSetForm = createFormComponent<any>({
  widgetLoaders: stubWidgetLoaders as Record<string, () => Promise<Type<WithWidget>>>,
  validators: () => noopValidators,
  resolveFormInput,
});
safeDefine('dx-events-spec-form', WidgetSetForm);

const mountWrapper = async () => {
  const wrapper = document.createElement('dx-events-spec-form') as WidgetSetFormElement;
  wrapper.config = { formDef: {}, data: { firstName: 'Ada' } };
  document.body.append(wrapper);
  await vi.waitFor(() => expect(wrapper.querySelector('input')).not.toBeNull());
  return wrapper;
};

beforeAll(async () => {
  await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
});

afterEach(() => {
  recordedAdapters.length = 0;
  document.body.innerHTML = '';
  resolvedHandler = () => undefined;
});

describe('a form event of a widget set form with a resolved event handler', () => {
  it('calls the resolved handler first and then the host listener, with the same event object', async () => {
    const calls: { source: string; event: FormEvent }[] = [];
    resolvedHandler = (event) => calls.push({ source: 'resolved', event });
    const wrapper = await mountWrapper();
    wrapper.addEventListener('formEvent', (event) =>
      calls.push({ source: 'host', event: (event as CustomEvent<FormEvent>).detail }),
    );

    lastAdapter<InputAdapter<string>>('firstName').valueChanged('Grace');

    expect(calls.map((call) => call.source)).toEqual(['resolved', 'host']);
    expect(calls[1].event).toBe(calls[0].event);
    expect(calls[0].event).toMatchObject({
      name: 'firstNameChanged',
      data: { firstName: 'Grace' },
    });
  });

  it('calls the resolved handler when no host listener is added', async () => {
    const handler = vi.fn();
    resolvedHandler = handler;
    await mountWrapper();

    lastAdapter<InputAdapter<string>>('firstName').valueChanged('Grace');

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
