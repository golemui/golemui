// @vitest-environment jsdom
import {
  type Action,
  type FormInitConfig,
  identityTranslator,
  type Middleware,
  type NonFunctionWidget,
  preloadFormWidgets,
  type State,
  type ValidatorFn,
  type WithWidget,
} from '@golemui/core';
import { safeDefine } from '@golemui/lit-utils';
import { provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { FormElement } from '../components/form/form.element';
import { formContext, LitFormContext } from '../context/form.context';
import {
  type ActionAdapter,
  type DisplayAdapter,
  type InputAdapter,
  type LayoutAdapter,
  afterLitRenderSchedule,
  lastAdapter,
  noopValidators,
  recordedAdapters,
  stubWidgetLoaders,
} from '../ssr.fixture';
import '../components/widget/widget-element';

/**
 * Checks what the widget adapters hold in templateData, with a real store and the stub widgets
 * of the fixture.
 *
 * Run: npx vitest run --config libs/lit/vite.config.ts src/lib/adapters/adapters.spec.ts
 */

type StubConfig = FormInitConfig<WithWidget>;

// The fixture loaders resolve to element classes, the form config expects widget instances.
const loaders = stubWidgetLoaders as unknown as StubConfig['widgetLoaders'];

/** Fails an empty value when the validator descriptor has `required: true`. */
const requiredValidators: ValidatorFn<{ required?: boolean }> = (validator) => ({
  '~standard': {
    version: 1,
    vendor: 'adapters-spec',
    validate: (value: unknown) => {
      const isEmpty = value === undefined || value === null || value === '';
      if (validator?.required && isEmpty) {
        return { issues: [{ message: 'required' }] };
      }
      return { value };
    },
  },
});

const rootLayout = (children: unknown[], extra: Record<string, unknown> = {}) => ({
  ...extra,
  form: { uid: 'root', kind: 'layout', type: 'flex', children },
});

const firstNameInput = { uid: 'firstName', kind: 'input', type: 'textinput', path: 'firstName' };

const usersRepeater = (extra: Record<string, unknown> = {}) => ({
  uid: 'users',
  kind: 'input',
  type: 'repeater',
  path: 'users',
  ...extra,
  props: {
    template: {
      uid: 'userRow',
      kind: 'layout',
      type: 'flex',
      children: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'users.items.name' }],
    },
  },
});

/** Renders widgets inside a form context, without a layout above them. */
class WidgetsWithoutLayoutElement extends LitElement {
  @provide({ context: formContext })
  context = new LitFormContext<WithWidget>();

  widgets: NonFunctionWidget<string>[] = [];

  override createRenderRoot() {
    return this;
  }

  override render() {
    return this.widgets.map((widget) => html`<gui-widget .widget=${widget}></gui-widget>`);
  }
}

safeDefine('adapters-spec-widgets', WidgetsWithoutLayoutElement);

const mountForm = async (config: StubConfig, validators: ValidatorFn<any> = noopValidators) => {
  const form = document.createElement('gui-core-form') as FormElement;
  form.validators = validators;
  form.config = config;
  document.body.append(form);
  await afterLitRenderSchedule();
  const formElement = () => form.querySelector('form') as HTMLFormElement;
  const setData = async (data: Record<string, unknown>) => {
    form.setData(data);
    await afterLitRenderSchedule();
  };
  const submit = async () => {
    formElement().dispatchEvent(new Event('submit', { cancelable: true }));
    await afterLitRenderSchedule();
  };
  const setConfig = async (nextConfig: StubConfig) => {
    form.config = nextConfig;
    await afterLitRenderSchedule();
  };
  return { form, formElement, setData, submit, setConfig };
};

/**
 * Renders the widgets with these uids directly inside a form context, without their layout. A
 * layout removes a hidden child, so this is the only way to see what an adapter holds while its
 * widget is hidden.
 */
const mountWidgetsWithoutLayout = async (
  formDef: StubConfig['formDef'],
  data: Record<string, unknown>,
  uids: string[],
) => {
  const host = document.createElement('adapters-spec-widgets') as WidgetsWithoutLayoutElement;
  const { context } = host;
  context.initialize(loaders, [], noopValidators, 'eager', {}, undefined, {});
  context.store.dispatch({ type: 'INITIALIZE', payload: { formName: 'adapters', formDef } });
  context.store.dispatch({ type: 'SET_DATA', payload: { data } });
  const sources = context.store.getState().resolvedSources;
  host.widgets = uids.map((uid) => sources[uid] as NonFunctionWidget<string>);
  document.body.append(host);
  await afterLitRenderSchedule();
  const setData = async (nextData: Record<string, unknown>) => {
    context.store.dispatch({ type: 'SET_DATA', payload: { data: nextData } });
    await afterLitRenderSchedule();
  };
  return { setData };
};

const childUids = (adapter: LayoutAdapter) =>
  adapter.templateData.children.map((child) => child.uid);

beforeAll(async () => {
  // Preloaded widgets render in the first render, so no spec waits for a dynamic import.
  await preloadFormWidgets({ widgetLoaders: loaders });
});

afterEach(() => {
  document.body.innerHTML = '';
  recordedAdapters.length = 0;
});

describe('InputWidgetAdapter', () => {
  const requiredFirstName = rootLayout([
    { ...firstNameInput, label: 'First name', validator: { required: true } },
    { uid: 'save', kind: 'action', type: 'button', actionType: 'submit', label: 'Save' },
  ]);

  it('holds no errors and an untouched state before the form is touched', async () => {
    await mountForm(
      { formDef: requiredFirstName, widgetLoaders: loaders, data: {} },
      requiredValidators,
    );

    const { templateData } = lastAdapter<InputAdapter<string>>('firstName');
    expect(templateData.errors).toEqual([]);
    expect(templateData.touched).toBe(false);
  });

  it('holds the errors of a required empty input after a submit', async () => {
    const { submit } = await mountForm(
      { formDef: requiredFirstName, widgetLoaders: loaders, data: {} },
      requiredValidators,
    );

    await submit();

    const { templateData } = lastAdapter<InputAdapter<string>>('firstName');
    expect(templateData.errors).toEqual(['required']);
    expect(templateData.touched).toBe(true);
  });

  it('holds value, errors and touched inside templateData', async () => {
    await mountForm({
      formDef: rootLayout([{ ...firstNameInput, label: 'First name' }]),
      widgetLoaders: loaders,
      data: { firstName: 'Ada' },
    });

    const adapter = lastAdapter<InputAdapter<string>>('firstName');
    expect(adapter.templateData).toMatchObject({ value: 'Ada', errors: [], touched: false });
    expect(adapter.templateData).not.toHaveProperty('isTouched');
    expect(adapter).not.toHaveProperty('value');
  });

  it('flattens the calculated widget and its props into templateData, with lang and deps', async () => {
    const dependencies = { markdownParser: () => '' };
    await mountForm({
      formDef: rootLayout([
        { ...firstNameInput, label: 'First name', props: { hint: 'Hello {{$form.firstName}}' } },
      ]),
      widgetLoaders: loaders,
      data: { firstName: 'Ada' },
      dependencies,
      localization: identityTranslator('en-GB'),
    });

    const { templateData } = lastAdapter<InputAdapter<string>>('firstName');
    expect(templateData).toMatchObject({
      uid: 'firstName',
      kind: 'input',
      type: 'textinput',
      path: 'firstName',
      label: 'First name',
      hint: 'Hello Ada',
      lang: 'en-GB',
    });
    expect(templateData.deps).toBe(dependencies);
  });

  it('uses the value of a suffixed prop while its state is active', async () => {
    const { setData } = await mountForm({
      formDef: rootLayout(
        [{ ...firstNameInput, label: 'First name', 'label.adult': 'Legal name' }],
        { states: { adult: '$form.age >= 18' } },
      ),
      widgetLoaders: loaders,
      data: { age: 20 },
    });
    const adapter = lastAdapter<InputAdapter>('firstName');

    expect(adapter.templateData.label).toBe('Legal name');

    await setData({ age: 10 });

    expect(adapter.templateData.label).toBe('First name');
  });

  it('keeps the last visible templateData while hidden, and still updates the value', async () => {
    const formDef = rootLayout([
      {
        ...firstNameInput,
        label: 'Name: {{$form.firstName}}',
        exclude: { when: '$form.hideFirstName === true' },
      },
    ]);
    const { setData } = await mountWidgetsWithoutLayout(formDef, { firstName: 'Ada' }, [
      'firstName',
    ]);
    const adapter = lastAdapter<InputAdapter<string>>('firstName');
    expect(adapter.templateData.label).toBe('Name: Ada');

    await setData({ firstName: 'Grace', hideFirstName: true });

    expect(adapter.templateData.value).toBe('Grace');
    expect(adapter.templateData.label).toBe('Name: Ada');
  });

  it('updates templateData.lang when the language changes', async () => {
    const translator = identityTranslator('en-US');
    await mountForm({
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: loaders,
      data: {},
      localization: translator,
    });
    const adapter = lastAdapter<InputAdapter>('firstName');
    expect(adapter.templateData.lang).toBe('en-US');

    translator.setLang('es');

    expect(adapter.templateData.lang).toBe('es');
  });
});

describe('InputWidgetAdapter for a repeater', () => {
  it('lists one row node per data row, with the row index in the uid', async () => {
    await mountForm({
      formDef: rootLayout([usersRepeater()]),
      widgetLoaders: loaders,
      data: { users: [{ name: 'Ada' }, { name: 'Linus' }] },
    });

    const { templateData } = lastAdapter<InputAdapter<unknown[]>>('users');
    expect(templateData.rows?.map((row) => row.uid)).toEqual(['userRow[0]', 'userRow[1]']);
  });

  it('keeps the last rows while the repeater is hidden', async () => {
    const formDef = rootLayout([usersRepeater({ exclude: { when: '$form.hideUsers === true' } })]);
    const { setData } = await mountWidgetsWithoutLayout(
      formDef,
      { users: [{ name: 'Ada' }, { name: 'Linus' }] },
      ['users'],
    );

    await setData({ users: [{ name: 'Ada' }], hideUsers: true });

    const { templateData } = lastAdapter<InputAdapter<unknown[]>>('users');
    expect(templateData.value).toEqual([{ name: 'Ada' }]);
    expect(templateData.rows?.map((row) => row.uid)).toEqual(['userRow[0]', 'userRow[1]']);
  });
});

describe('LayoutWidgetAdapter', () => {
  it('lists the children of a repeater row with the row index in the uid and the path', async () => {
    await mountForm({
      formDef: rootLayout([usersRepeater()]),
      widgetLoaders: loaders,
      data: { users: [{ name: 'Ada' }, { name: 'Linus' }] },
    });

    const secondRow = lastAdapter<LayoutAdapter>('userRow[1]');
    expect(secondRow.templateData.children).toEqual([
      expect.objectContaining({ uid: 'name[1]', path: 'users.1.name' }),
    ]);
    expect(lastAdapter<InputAdapter<string>>('name[1]').templateData.value).toBe('Linus');
  });

  it('removes a hidden child from children', async () => {
    const { setData } = await mountForm({
      formDef: rootLayout([
        firstNameInput,
        {
          uid: 'nickname',
          kind: 'input',
          type: 'textinput',
          path: 'nickname',
          exclude: { when: '$form.hideNickname === true' },
        },
      ]),
      widgetLoaders: loaders,
      data: {},
    });
    expect(childUids(lastAdapter('root'))).toEqual(['firstName', 'nickname']);

    await setData({ hideNickname: true });

    expect(childUids(lastAdapter('root'))).toEqual(['firstName']);
  });

  it('keeps the last children while the layout is hidden', async () => {
    const formDef = rootLayout([
      {
        uid: 'box',
        kind: 'layout',
        type: 'flex',
        exclude: { when: '$form.hideBox === true' },
        children: [
          firstNameInput,
          {
            uid: 'nickname',
            kind: 'input',
            type: 'textinput',
            path: 'nickname',
            exclude: { when: '$form.hideNickname === true' },
          },
        ],
      },
    ]);
    const { setData } = await mountWidgetsWithoutLayout(formDef, {}, ['box']);
    expect(childUids(lastAdapter('box'))).toEqual(['firstName', 'nickname']);

    // A visible layout would drop the hidden nickname.
    await setData({ hideBox: true, hideNickname: true });

    expect(childUids(lastAdapter('box'))).toEqual(['firstName', 'nickname']);
  });

  it('seeds templateData with the raw props while the layout has never been visible', async () => {
    const formDef = rootLayout([
      {
        uid: 'box',
        kind: 'layout',
        type: 'flex',
        props: { gap: '{{$form.gap}}' },
        exclude: { when: '$form.hideBox === true' },
        children: [firstNameInput],
      },
    ]);
    const { setData } = await mountWidgetsWithoutLayout(formDef, { gap: 'large', hideBox: true }, [
      'box',
    ]);
    const adapter = lastAdapter<LayoutAdapter>('box');
    expect(adapter.templateData).toMatchObject({ gap: '{{$form.gap}}' });

    await setData({ gap: 'large', hideBox: false });

    expect(adapter.templateData).toMatchObject({ gap: 'large' });
    expect(childUids(adapter)).toEqual(['firstName']);
  });
});

describe('ActionWidgetAdapter', () => {
  it('sets templateData.invalid only after a submit of an invalid form', async () => {
    const { submit } = await mountForm(
      {
        formDef: rootLayout([
          { ...firstNameInput, validator: { required: true } },
          { uid: 'save', kind: 'action', type: 'button', actionType: 'submit', label: 'Save' },
        ]),
        widgetLoaders: loaders,
        data: {},
      },
      requiredValidators,
    );
    const adapter = lastAdapter<ActionAdapter>('save');
    expect(adapter.templateData.invalid).toBe(false);

    await submit();

    expect(adapter.templateData.invalid).toBe(true);
  });

  it('seeds templateData with the raw label, icon and iconPosition while the action has never been visible', async () => {
    const formDef = rootLayout([
      {
        uid: 'save',
        kind: 'action',
        type: 'button',
        label: 'Save {{$form.name}}',
        props: { icon: 'save', iconPosition: 'end' },
        exclude: { when: '$form.hideSave === true' },
      },
    ]);
    const { setData } = await mountWidgetsWithoutLayout(formDef, { name: 'Ada', hideSave: true }, [
      'save',
    ]);
    const adapter = lastAdapter<ActionAdapter>('save');
    expect(adapter.templateData).toEqual({
      label: 'Save {{$form.name}}',
      icon: 'save',
      iconPosition: 'end',
      invalid: false,
    });

    await setData({ name: 'Ada', hideSave: false });

    expect(adapter.templateData.label).toBe('Save Ada');
  });
});

describe('DisplayWidgetAdapter', () => {
  it('carries the calculated widget and its props in templateData', async () => {
    await mountForm({
      formDef: rootLayout([
        { uid: 'greeting', kind: 'display', type: 'text', props: { text: 'Hi {{$form.name}}' } },
      ]),
      widgetLoaders: loaders,
      data: { name: 'Ada' },
    });

    expect(lastAdapter<DisplayAdapter>('greeting').templateData).toMatchObject({
      uid: 'greeting',
      kind: 'display',
      type: 'text',
      text: 'Hi Ada',
    });
  });

  it('seeds templateData with the raw props while the widget has never been visible', async () => {
    const formDef = rootLayout([
      {
        uid: 'greeting',
        kind: 'display',
        type: 'text',
        props: { text: 'Hi {{$form.name}}' },
        exclude: { when: '$form.hideGreeting === true' },
      },
    ]);
    const { setData } = await mountWidgetsWithoutLayout(
      formDef,
      { name: 'Ada', hideGreeting: true },
      ['greeting'],
    );
    const adapter = lastAdapter<DisplayAdapter>('greeting');
    expect(adapter.templateData).toEqual({ text: 'Hi {{$form.name}}' });

    await setData({ name: 'Ada', hideGreeting: false });

    expect(adapter.templateData).toMatchObject({ text: 'Hi Ada' });
  });
});

describe('the form id', () => {
  const formNameRecorder = () => {
    const formNames: string[] = [];
    const middleware: Middleware<State, Action> = (api) => (next) => (action) => {
      next(action);
      formNames.push(api.getState().formName);
    };
    return { formNames, middleware };
  };

  it('uses a random id as the form element id and the store formName when formName is not set', async () => {
    const recorder = formNameRecorder();
    const { formElement } = await mountForm({
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: loaders,
      data: {},
      middlewares: [recorder.middleware],
    });

    expect(formElement().id).toMatch(/^[0-9a-f]{8}$/);
    expect(recorder.formNames.at(-1)).toBe(formElement().id);
  });

  it('uses formName as the form element id and as the store formName', async () => {
    const recorder = formNameRecorder();
    const { formElement } = await mountForm({
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: loaders,
      data: {},
      formName: 'signup',
      middlewares: [recorder.middleware],
    });

    expect(formElement().id).toBe('signup');
    expect(recorder.formNames.at(-1)).toBe('signup');
  });

  it('gives two forms on one page different ids', async () => {
    const config = (): StubConfig => ({
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: loaders,
      data: {},
    });
    const first = await mountForm(config());
    const second = await mountForm(config());

    expect(document.querySelectorAll('form')).toHaveLength(2);
    expect(first.formElement().id).not.toBe(second.formElement().id);
  });
});

describe('a formDef changed on the same config object', () => {
  it('renders nothing new until a new config object arrives', async () => {
    const config: StubConfig = {
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: loaders,
      data: {},
    };
    const mounted = await mountForm(config);
    const renderedInputIds = () =>
      Array.from(mounted.form.querySelectorAll('input')).map((input) => input.id);
    expect(renderedInputIds()).toEqual(['firstName']);

    // Lit compares a property with the previous value by identity.
    config.formDef = rootLayout([
      { uid: 'email', kind: 'input', type: 'textinput', path: 'email' },
    ]);
    await mounted.setConfig(config);

    expect(renderedInputIds()).toEqual(['firstName']);

    await mounted.setConfig({ ...config });

    expect(renderedInputIds()).toEqual(['email']);
  });
});
