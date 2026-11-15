// @vitest-environment jsdom
import {
  type Action,
  type FormHealth,
  type Middleware,
  preloadFormWidgets,
  type State,
} from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import type { FormElement as CoreFormElement } from '@golemui/lit';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { widgetLoaders } from '../widget.loaders';
import type { FormElement } from './form.element';
import './form.element';

// Lit renders on the microtask schedule, so one macrotask completes every nested render.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const formDef = { form: { uid: 'root', kind: 'layout', type: 'flex', children: [] } };

const coreStoreState = (form: FormElement) =>
  (form.querySelector('gui-core-form') as CoreFormElement).context.store.getState();

beforeAll(async () => {
  await preloadFormWidgets({ widgetLoaders: { flex: widgetLoaders.flex } });
}, 30_000);

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('a call on gui-form after a new config and before the form starts with it', () => {
  const draft = { firstName: 'Bob' };
  const callHealth: FormHealth = { status: 'errored', code: 10_004, message: 'call after config' };

  /**
   * Each store that the form creates with the returned configs adds one list of action types to
   * `actionTypesByStore`, so a spec can check the actions of the old store and of the new store
   * separately.
   */
  const recordActionsByStore = () => {
    const actionTypesByStore: string[][] = [];
    const middleware: Middleware<State, Action> = () => {
      const actionTypes: string[] = [];
      actionTypesByStore.push(actionTypes);
      return (next) => (action) => {
        actionTypes.push(action.type);
        return next(action);
      };
    };
    const configWith = (values: Record<string, unknown> = {}) =>
      ({
        formDef,
        data: { firstName: 'Ada' },
        middlewares: [middleware],
        ...values,
      }) as GuiFormInitConfig;
    return { actionTypesByStore, configWith };
  };

  /** Mounts a gui-form and clears the actions of its start. */
  async function mountRecordedForm() {
    const recorder = recordActionsByStore();
    const form = document.createElement('gui-form') as FormElement;
    form.config = recorder.configWith();
    document.body.append(form);
    await settle();
    const oldStoreActions = recorder.actionTypesByStore[0];
    oldStoreActions.length = 0;
    return { form, oldStoreActions, recorder };
  }

  it('starts the new form with the data of a setData call', async () => {
    const { form, oldStoreActions, recorder } = await mountRecordedForm();

    form.config = recorder.configWith({ data: { firstName: 'Dana' } });
    form.setData(draft);
    await settle();

    expect(coreStoreState(form).data).toEqual(draft);
    expect(oldStoreActions).toEqual([]);
    expect(recorder.actionTypesByStore).toHaveLength(2);
  });

  it('starts the new form with the meta of a setMeta call', async () => {
    const { form, oldStoreActions, recorder } = await mountRecordedForm();

    form.config = recorder.configWith({ meta: { tier: 'free' } });
    form.setMeta({ tier: 'paid' });
    await settle();

    expect(coreStoreState(form).meta).toEqual({ tier: 'paid' });
    expect(oldStoreActions).toEqual([]);
    expect(recorder.actionTypesByStore).toHaveLength(2);
  });

  it('dispatches ok for the new form and then the health of a setHealth call', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { form, oldStoreActions, recorder } = await mountRecordedForm();
    const healths: FormHealth[] = [];
    form.addEventListener('formHealth', (event) =>
      healths.push((event as CustomEvent<FormHealth>).detail),
    );

    form.config = recorder.configWith();
    form.setHealth(callHealth);
    await settle();

    expect(healths).toEqual([{ status: 'ok' }, callHealth]);
    expect(coreStoreState(form).formHealth).toEqual(callHealth);
    expect(oldStoreActions).toEqual([]);
  });

  it('gives a setData call made before the new config to the old form', async () => {
    const { form, oldStoreActions, recorder } = await mountRecordedForm();

    form.setData(draft);
    form.config = recorder.configWith({ data: { firstName: 'Dana' } });
    await settle();

    expect(oldStoreActions).toEqual(['SET_DATA']);
  });

  it('starts the new form with the data of the new config after a setData call made before the new config', async () => {
    const { form, recorder } = await mountRecordedForm();

    form.setData(draft);
    form.config = recorder.configWith({ data: { firstName: 'Dana' } });
    await settle();

    expect(coreStoreState(form).data).toEqual({ firstName: 'Dana' });
  });

  it('applies a setData call at once when no new config waits', async () => {
    const { form, oldStoreActions } = await mountRecordedForm();

    form.setData(draft);

    expect(coreStoreState(form).data).toEqual(draft);
    expect(oldStoreActions).toEqual(['SET_DATA']);
  });

  it('starts one time with the last config and drops a setData call made for a config that was replaced in the same task', async () => {
    const { form, oldStoreActions, recorder } = await mountRecordedForm();

    form.config = recorder.configWith({ data: { firstName: 'Bea' } });
    form.setData(draft);
    form.config = recorder.configWith({ data: { firstName: 'Cid' } });
    await settle();

    expect(recorder.actionTypesByStore).toHaveLength(2);
    expect(coreStoreState(form).data).toEqual({ firstName: 'Cid' });
    expect(oldStoreActions).toEqual([]);
  });
});
