// @vitest-environment jsdom
import {
  type FormHealth,
  identityTranslator,
  preloadFormWidgets,
  type WithWidget,
} from '@golemui/core';
import { safeDefine } from '@golemui/lit-utils';
import { html } from 'lit';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  afterLitRenderSchedule,
  noopValidators,
  recordActionsByStore,
  stubWidgetLoaders,
} from '../../ssr.fixture';
import type { Type } from '../../utils/type';
import { createFormComponent, type WidgetSetFormElement } from './createFormComponent';
import type { FormElement } from './form.element';
import type { FormHealthBoundary } from './form-health-boundary';

const WidgetSetForm = createFormComponent<any>({
  widgetLoaders: stubWidgetLoaders as Record<string, () => Promise<Type<WithWidget>>>,
  validators: () => noopValidators,
});
safeDefine('create-form-component-spec-form', WidgetSetForm);

class WidgetSetFormSubclass extends WidgetSetForm {
  override firstUpdated() {
    this.dataset['rendered'] = 'true';
  }
}
safeDefine('create-form-component-spec-subclass', WidgetSetFormSubclass);

const formDef = {
  form: {
    uid: 'root',
    kind: 'layout',
    type: 'flex',
    children: [{ uid: 'firstName', kind: 'input', type: 'textinput', path: 'firstName' }],
  },
};

const createWrapper = () => {
  const wrapper = document.createElement('create-form-component-spec-form') as WidgetSetFormElement;
  wrapper.config = { formDef, data: {} };
  return wrapper;
};

beforeAll(async () => {
  await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('setData and setMeta on a form element built by createFormComponent', () => {
  const coreStoreState = (wrapper: WidgetSetFormElement) =>
    (wrapper.querySelector('gui-core-form') as FormElement).context.store.getState();

  it('keeps a setData call made before the element is in the page', async () => {
    const wrapper = createWrapper();

    wrapper.setData({ firstName: 'Bob' });
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    expect(coreStoreState(wrapper).data).toEqual({ firstName: 'Bob' });
  });

  it('keeps a setData call made after the element is in the page but before its first update', async () => {
    const wrapper = createWrapper();
    document.body.append(wrapper);

    wrapper.setData({ firstName: 'Bob' });
    await afterLitRenderSchedule();

    expect(coreStoreState(wrapper).data).toEqual({ firstName: 'Bob' });
  });

  it('keeps a setMeta call made before the element is in the page', async () => {
    const wrapper = createWrapper();

    wrapper.setMeta({ tier: 'paid' });
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    expect(coreStoreState(wrapper).meta).toEqual({ tier: 'paid' });
  });

  it('keeps a setHealth call made before the element is in the page', async () => {
    const wrapper = createWrapper();

    wrapper.setHealth({ status: 'errored' as const, code: 10_001, message: 'Set early' });
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    expect(coreStoreState(wrapper).formHealth).toEqual({
      status: 'errored' as const,
      code: 10_001,
      message: 'Set early',
    });
  });

  it('keeps a setData call made before two config assignments that come before the first update', async () => {
    const wrapper = document.createElement(
      'create-form-component-spec-form',
    ) as WidgetSetFormElement;

    wrapper.setData({ firstName: 'Bob' });
    wrapper.config = { formDef, data: {} };
    wrapper.config = { formDef, data: {}, localization: identityTranslator('en-US') };
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    expect(coreStoreState(wrapper).data).toEqual({ firstName: 'Bob' });
  });

  it('keeps a setData call made between two config assignments that come before the first update', async () => {
    const wrapper = document.createElement(
      'create-form-component-spec-form',
    ) as WidgetSetFormElement;

    wrapper.config = { formDef, data: {} };
    wrapper.setData({ firstName: 'Bob' });
    wrapper.config = { formDef, data: {}, localization: identityTranslator('en-US') };
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    expect(coreStoreState(wrapper).data).toEqual({ firstName: 'Bob' });
  });

  it('keeps an early setData call in a subclass that has its own firstUpdated', async () => {
    const wrapper = document.createElement(
      'create-form-component-spec-subclass',
    ) as WidgetSetFormElement;
    wrapper.config = { formDef, data: {} };

    wrapper.setData({ firstName: 'Bob' });
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    expect(coreStoreState(wrapper).data).toEqual({ firstName: 'Bob' });
  });

  it('applies a setData call after the start at once', async () => {
    const wrapper = createWrapper();
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    wrapper.setData({ firstName: 'Bob' });

    expect(coreStoreState(wrapper).data).toEqual({ firstName: 'Bob' });
  });
});

describe('a call on a form element built by createFormComponent after a new config', () => {
  const draft = { firstName: 'Bob' };
  const callHealth: FormHealth = { status: 'errored', code: 10_004, message: 'call after config' };

  const coreStoreState = (wrapper: WidgetSetFormElement) =>
    (wrapper.querySelector('gui-core-form') as FormElement).context.store.getState();

  /** Records the actions of each store, and builds configs with the recording middleware. */
  const createRecorder = () => {
    const { actionTypesByStore, middleware } = recordActionsByStore();
    const configWith = (values: Record<string, unknown> = {}) => ({
      formDef,
      data: { firstName: 'Ada' },
      middlewares: [middleware],
      ...values,
    });
    return { actionTypesByStore, configWith };
  };

  const formDefThatFailsToResolve = { form: { uid: 'root', kind: 'layout', type: 'flex' } };
  const resolveError = new Error('The form input could not be resolved');

  class WidgetSetFormThatKeepsUpdateErrors extends createFormComponent<any>({
    widgetLoaders: stubWidgetLoaders as Record<string, () => Promise<Type<WithWidget>>>,
    validators: () => noopValidators,
    resolveFormInput: (formDefinition) => {
      if (formDefinition === formDefThatFailsToResolve) {
        throw resolveError;
      }
      return { formDef: formDefinition as Record<string, any> };
    },
  }) {
    updateErrors: unknown[] = [];

    // Lit would reject updateComplete and throw the error again at the next update. This keeps
    // it for the spec instead.
    protected override scheduleUpdate() {
      try {
        super.scheduleUpdate();
      } catch (error) {
        this.updateErrors.push(error);
      }
    }
  }
  safeDefine('create-form-component-spec-update-error', WidgetSetFormThatKeepsUpdateErrors);
  const tagThatKeepsUpdateErrors = 'create-form-component-spec-update-error';

  /** Mounts a wrapper and clears the actions of its start. */
  async function mountRecordedWrapper(tagName = 'create-form-component-spec-form') {
    const recorder = createRecorder();
    const wrapper = document.createElement(tagName) as WidgetSetFormElement;
    wrapper.config = recorder.configWith();
    document.body.append(wrapper);
    await afterLitRenderSchedule();
    const oldStoreActions = recorder.actionTypesByStore[0];
    oldStoreActions.length = 0;
    return { wrapper, oldStoreActions, recorder };
  }

  it('starts the new form with the data of a setData call made after the new config', async () => {
    const { wrapper, oldStoreActions, recorder } = await mountRecordedWrapper();

    wrapper.config = recorder.configWith({ data: { firstName: 'Dana' } });
    wrapper.setData(draft);
    await afterLitRenderSchedule();

    expect(coreStoreState(wrapper).data).toEqual(draft);
    expect(oldStoreActions).toEqual([]);
    expect(recorder.actionTypesByStore).toHaveLength(2);
  });

  it('starts the new form with the meta of a setMeta call made after the new config', async () => {
    const { wrapper, oldStoreActions, recorder } = await mountRecordedWrapper();

    wrapper.config = recorder.configWith({ meta: { tier: 'free' } });
    wrapper.setMeta({ tier: 'paid' });
    await afterLitRenderSchedule();

    expect(coreStoreState(wrapper).meta).toEqual({ tier: 'paid' });
    expect(oldStoreActions).toEqual([]);
    expect(recorder.actionTypesByStore).toHaveLength(2);
  });

  it('dispatches ok for the new form and then the health of a setHealth call made after the new config', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { wrapper, oldStoreActions, recorder } = await mountRecordedWrapper();
    const healths: FormHealth[] = [];
    wrapper.addEventListener('formHealth', (event) =>
      healths.push((event as CustomEvent<FormHealth>).detail),
    );

    wrapper.config = recorder.configWith();
    wrapper.setHealth(callHealth);
    await afterLitRenderSchedule();

    expect(healths).toEqual([{ status: 'ok' }, callHealth]);
    expect(coreStoreState(wrapper).formHealth).toEqual(callHealth);
    expect(oldStoreActions).toEqual([]);
  });

  it('gives a setData call made before the new config to the old form', async () => {
    const { wrapper, oldStoreActions, recorder } = await mountRecordedWrapper();

    wrapper.setData(draft);
    wrapper.config = recorder.configWith({ data: { firstName: 'Dana' } });
    await afterLitRenderSchedule();

    expect(oldStoreActions).toEqual(['SET_DATA']);
  });

  it('starts the new form with the data of the new config after a setData call made before the new config', async () => {
    const { wrapper, recorder } = await mountRecordedWrapper();

    wrapper.setData(draft);
    wrapper.config = recorder.configWith({ data: { firstName: 'Dana' } });
    await afterLitRenderSchedule();

    expect(coreStoreState(wrapper).data).toEqual({ firstName: 'Dana' });
  });

  it('applies a setData call at once when no new config waits', async () => {
    const { wrapper, oldStoreActions } = await mountRecordedWrapper();

    wrapper.setData(draft);

    expect(coreStoreState(wrapper).data).toEqual(draft);
    expect(oldStoreActions).toEqual(['SET_DATA']);
  });

  it('starts one time with the last config and drops a setData call made for a config that was replaced in the same task', async () => {
    const { wrapper, oldStoreActions, recorder } = await mountRecordedWrapper();

    wrapper.config = recorder.configWith({ data: { firstName: 'Bea' } });
    wrapper.setData(draft);
    wrapper.config = recorder.configWith({ data: { firstName: 'Cid' } });
    await afterLitRenderSchedule();

    expect(recorder.actionTypesByStore).toHaveLength(2);
    expect(coreStoreState(wrapper).data).toEqual({ firstName: 'Cid' });
    expect(oldStoreActions).toEqual([]);
  });

  describe('with a config whose build throws', () => {
    const tagName = tagThatKeepsUpdateErrors;

    it('applies a later setData call to the core form at once', async () => {
      const { wrapper, oldStoreActions, recorder } = await mountRecordedWrapper(tagName);

      wrapper.config = recorder.configWith({ formDef: formDefThatFailsToResolve });
      await afterLitRenderSchedule();
      wrapper.setData(draft);

      expect((wrapper as WidgetSetFormThatKeepsUpdateErrors).updateErrors).toEqual([resolveError]);
      expect(coreStoreState(wrapper).data).toEqual(draft);
      expect(oldStoreActions).toEqual(['SET_DATA']);
    });

    it('drops a setData call made for that config, so a later update does not apply it', async () => {
      const { wrapper, oldStoreActions, recorder } = await mountRecordedWrapper(tagName);

      wrapper.config = recorder.configWith({ formDef: formDefThatFailsToResolve });
      wrapper.setData(draft);
      await afterLitRenderSchedule();
      wrapper.setData({ firstName: 'Later' });
      wrapper.autocomplete = 'off';
      await afterLitRenderSchedule();

      expect(coreStoreState(wrapper).data).toEqual({ firstName: 'Later' });
      expect(oldStoreActions).toEqual(['SET_DATA']);
    });
  });

  describe('with a config that becomes undefined', () => {
    const undefinedConfig = undefined as unknown as WidgetSetFormElement['config'];

    it('gives a setData call made after a new config to the old form at once when the config becomes undefined in the same task', async () => {
      const { wrapper, oldStoreActions, recorder } =
        await mountRecordedWrapper(tagThatKeepsUpdateErrors);

      wrapper.config = recorder.configWith({ data: { firstName: 'Dana' } });
      wrapper.setData(draft);
      wrapper.config = undefinedConfig;

      expect(oldStoreActions).toEqual(['SET_DATA']);
      expect(coreStoreState(wrapper).data).toEqual(draft);
    });

    it('starts no new form when a new config becomes undefined in the same task', async () => {
      const { wrapper, recorder } = await mountRecordedWrapper(tagThatKeepsUpdateErrors);

      wrapper.config = recorder.configWith({ data: { firstName: 'Dana' } });
      wrapper.setData(draft);
      wrapper.config = undefinedConfig;
      await afterLitRenderSchedule();

      expect((wrapper as WidgetSetFormThatKeepsUpdateErrors).updateErrors).toHaveLength(1);
      expect(recorder.actionTypesByStore).toHaveLength(1);
      expect(coreStoreState(wrapper).data).toEqual(draft);
    });

    it('applies a setData call to the core form at once after the config becomes undefined', async () => {
      const { wrapper, oldStoreActions } = await mountRecordedWrapper(tagThatKeepsUpdateErrors);

      wrapper.config = undefinedConfig;
      wrapper.setData(draft);

      expect(oldStoreActions).toEqual(['SET_DATA']);
      expect(coreStoreState(wrapper).data).toEqual(draft);
      await afterLitRenderSchedule();
      expect((wrapper as WidgetSetFormThatKeepsUpdateErrors).updateErrors).toHaveLength(1);
    });
  });
});

describe('a form element built by createFormComponent', () => {
  it('passes the autocomplete HTML attribute to the inner form element', async () => {
    const wrapper = createWrapper();
    wrapper.setAttribute('autocomplete', 'off');
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    expect(wrapper.querySelector('form')?.getAttribute('autocomplete')).toBe('off');

    wrapper.setAttribute('autocomplete', 'on');
    await afterLitRenderSchedule();

    expect(wrapper.querySelector('form')?.getAttribute('autocomplete')).toBe('on');
  });

  it('renders the inner form without autocomplete when the attribute is not set', async () => {
    const wrapper = createWrapper();
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    expect(wrapper.querySelector('form')).not.toBeNull();
    expect(wrapper.querySelector('form')?.hasAttribute('autocomplete')).toBe(false);
  });

  it('passes the formHealthBoundary property to gui-core-form, which renders the form through it', async () => {
    const boundary: FormHealthBoundary = ({ health, form }) =>
      html`<section class="custom-boundary" data-status=${health.status}>${form}</section>`;
    const wrapper = createWrapper();
    wrapper.formHealthBoundary = boundary;
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    const coreForm = wrapper.querySelector('gui-core-form') as FormElement;
    expect(coreForm.formHealthBoundary).toBe(boundary);
    const section = wrapper.querySelector('section.custom-boundary');
    expect(section?.getAttribute('data-status')).toBe('ok');
    expect(section?.querySelector('form input')?.id).toBe('firstName');
  });
});
