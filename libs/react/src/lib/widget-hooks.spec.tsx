// @vitest-environment jsdom
import {
  type Action,
  FormContext,
  type FormInitConfig,
  type FormSubmitEvent,
  identityTranslator,
  type Middleware,
  type NonFunctionWidget,
  preloadFormWidgets,
  type State,
  type ValidatorFn,
  type WithWidget,
} from '@golemui/core';
import { act, createRef, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FormComponent, type FormComponentHandle } from './FormComponent';
import { ReactFormContextProvider } from './ReactFormContextProvider';
import WidgetRenderer from './WidgetRenderer';
import {
  type ActionHookOutput,
  type DisplayHookOutput,
  type InputHookOutput,
  type LayoutHookOutput,
  hookOutputs,
  lastHookOutput,
  noopValidators,
  stubWidgetLoaders,
} from './ssr.fixture';

/**
 * Checks what the widget hooks return, with a real store and the stub widgets of the fixture.
 *
 * Run: npx vitest run --config libs/react/vite.config.ts src/lib/widget-hooks.spec.tsx
 */

type StubComponent = React.ComponentType<WithWidget>;

/** Fails an empty value when the validator descriptor has `required: true`. */
const requiredValidators: ValidatorFn<{ required?: boolean }> = (validator) => ({
  '~standard': {
    version: 1,
    vendor: 'widget-hooks-spec',
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

let root: Root | null = null;
let container: HTMLDivElement | null = null;

const render = async (element: ReactElement) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  const mountedRoot = createRoot(container);
  root = mountedRoot;
  await act(async () => mountedRoot.render(element));
  return container;
};

const mountForm = async (
  config: FormInitConfig<StubComponent>,
  options: {
    validators?: ValidatorFn<any>;
    formSubmit?: (event: FormSubmitEvent) => void;
  } = {},
) => {
  const formRef = createRef<FormComponentHandle>();
  const mounted = await render(
    <FormComponent
      ref={formRef}
      config={config}
      validators={options.validators ?? noopValidators}
      formSubmit={options.formSubmit}
    />,
  );
  const setData = (data: Record<string, unknown>) =>
    act(async () => formRef.current?.setData(data));
  return { container: mounted, setData };
};

/**
 * Renders the widgets with these uids directly inside a form context, without their layout. A
 * layout removes a hidden child, so this is the only way to see what a hook returns while its
 * widget is hidden.
 */
const mountWidgetsWithoutLayout = async (
  formDef: FormInitConfig<StubComponent>['formDef'],
  data: Record<string, unknown>,
  uids: string[],
) => {
  const context = new FormContext<StubComponent>();
  context.initialize(stubWidgetLoaders, [], noopValidators, 'eager', {}, undefined, {});
  context.store.dispatch({ type: 'INITIALIZE', payload: { formName: 'hooks', formDef } });
  context.store.dispatch({ type: 'SET_DATA', payload: { data } });
  const sources = context.store.getState().resolvedSources;
  await render(
    <ReactFormContextProvider formContext={context}>
      {uids.map((uid) => (
        <WidgetRenderer key={uid} widget={sources[uid] as NonFunctionWidget<string>} />
      ))}
    </ReactFormContextProvider>,
  );
  const setData = (nextData: Record<string, unknown>) =>
    act(async () => context.store.dispatch({ type: 'SET_DATA', payload: { data: nextData } }));
  return { setData };
};

const childUids = (output: LayoutHookOutput) => output.children.map((child) => child.uid);

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
});

describe('useInputWidget', () => {
  const requiredFirstName = rootLayout([
    { ...firstNameInput, label: 'First name', validator: { required: true } },
    { uid: 'save', kind: 'action', type: 'button', actionType: 'submit', label: 'Save' },
  ]);

  it('returns no errors and an untouched state before the form is touched', async () => {
    await mountForm(
      { formDef: requiredFirstName, widgetLoaders: stubWidgetLoaders, data: {} },
      { validators: requiredValidators },
    );

    const output = lastHookOutput<InputHookOutput<string>>('firstName');
    expect(output.errors).toEqual([]);
    expect(output.isTouched).toBe(false);
  });

  it('returns the errors of a required empty input after a submit', async () => {
    await mountForm(
      { formDef: requiredFirstName, widgetLoaders: stubWidgetLoaders, data: {} },
      { validators: requiredValidators },
    );

    await act(async () => lastHookOutput<ActionHookOutput>('save').onSubmit());

    const output = lastHookOutput<InputHookOutput<string>>('firstName');
    expect(output.errors).toEqual(['required']);
    expect(output.isTouched).toBe(true);
  });

  it('returns value, errors and isTouched next to templateData, not inside it', async () => {
    await mountForm({
      formDef: rootLayout([{ ...firstNameInput, label: 'First name' }]),
      widgetLoaders: stubWidgetLoaders,
      data: { firstName: 'Ada' },
    });

    const output = lastHookOutput<InputHookOutput<string>>('firstName');
    expect(Object.keys(output).sort()).toEqual([
      'errors',
      'injectValidationIssues',
      'isTouched',
      'onBlur',
      'onFilter',
      'onValueChanged',
      'templateData',
      'uid',
      'value',
    ]);
    expect(output.uid).toBe('firstName');
    expect(output.value).toBe('Ada');
    expect(output.templateData).not.toHaveProperty('value');
    expect(output.templateData).not.toHaveProperty('errors');
    expect(output.templateData).not.toHaveProperty('isTouched');
  });

  it('flattens the calculated widget and its props into templateData, with lang and deps', async () => {
    const dependencies = { markdownParser: () => '' };
    await mountForm({
      formDef: rootLayout([
        { ...firstNameInput, label: 'First name', props: { hint: 'Hello {{$form.firstName}}' } },
      ]),
      widgetLoaders: stubWidgetLoaders,
      data: { firstName: 'Ada' },
      dependencies,
      localization: identityTranslator('en-GB'),
    });

    const { templateData } = lastHookOutput<InputHookOutput<string>>('firstName');
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
      widgetLoaders: stubWidgetLoaders,
      data: { age: 20 },
    });

    expect(lastHookOutput<InputHookOutput>('firstName').templateData.label).toBe('Legal name');

    await setData({ age: 10 });

    expect(lastHookOutput<InputHookOutput>('firstName').templateData.label).toBe('First name');
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
    expect(lastHookOutput<InputHookOutput>('firstName').templateData.label).toBe('Name: Ada');

    await setData({ firstName: 'Grace', hideFirstName: true });

    const output = lastHookOutput<InputHookOutput<string>>('firstName');
    expect(output.value).toBe('Grace');
    expect(output.templateData.label).toBe('Name: Ada');
  });

  it('updates templateData.lang when the language changes', async () => {
    const translator = identityTranslator('en-US');
    await mountForm({
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: stubWidgetLoaders,
      data: {},
      localization: translator,
    });
    expect(lastHookOutput<InputHookOutput>('firstName').templateData.lang).toBe('en-US');

    await act(async () => translator.setLang('es'));

    expect(lastHookOutput<InputHookOutput>('firstName').templateData.lang).toBe('es');
  });
});

describe('useInputWidget for a repeater', () => {
  it('lists one row node per data row, with the row index in the uid', async () => {
    await mountForm({
      formDef: rootLayout([usersRepeater()]),
      widgetLoaders: stubWidgetLoaders,
      data: { users: [{ name: 'Ada' }, { name: 'Linus' }] },
    });

    const { templateData } = lastHookOutput<InputHookOutput<unknown[]>>('users');
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

    const output = lastHookOutput<InputHookOutput<unknown[]>>('users');
    expect(output.value).toEqual([{ name: 'Ada' }]);
    expect(output.templateData.rows?.map((row) => row.uid)).toEqual(['userRow[0]', 'userRow[1]']);
  });
});

describe('useLayoutWidget', () => {
  it('lists the children of a repeater row with the row index in the uid and the path', async () => {
    await mountForm({
      formDef: rootLayout([usersRepeater()]),
      widgetLoaders: stubWidgetLoaders,
      data: { users: [{ name: 'Ada' }, { name: 'Linus' }] },
    });

    const secondRow = lastHookOutput<LayoutHookOutput>('userRow[1]');
    expect(secondRow.children).toEqual([
      expect.objectContaining({ uid: 'name[1]', path: 'users.1.name' }),
    ]);
    expect(lastHookOutput<InputHookOutput<string>>('name[1]').value).toBe('Linus');
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
      widgetLoaders: stubWidgetLoaders,
      data: {},
    });
    expect(childUids(lastHookOutput('root'))).toEqual(['firstName', 'nickname']);

    await setData({ hideNickname: true });

    expect(childUids(lastHookOutput('root'))).toEqual(['firstName']);
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
    const boxRenderCount = () => hookOutputs.filter((record) => record.uid === 'box').length;
    const rendersBeforeHiding = boxRenderCount();
    expect(childUids(lastHookOutput('box'))).toEqual(['firstName', 'nickname']);

    // A visible layout would drop the hidden nickname.
    await setData({ hideBox: true, hideNickname: true });

    expect(boxRenderCount()).toBeGreaterThan(rendersBeforeHiding);
    expect(childUids(lastHookOutput('box'))).toEqual(['firstName', 'nickname']);
  });
});

describe('useActionWidget', () => {
  const requiredForm = rootLayout([
    { ...firstNameInput, validator: { required: true } },
    { uid: 'save', kind: 'action', type: 'button', actionType: 'submit', label: 'Save' },
  ]);

  it('sets templateData.invalid only after a submit of an invalid form', async () => {
    await mountForm(
      { formDef: requiredForm, widgetLoaders: stubWidgetLoaders, data: {} },
      { validators: requiredValidators },
    );
    expect(lastHookOutput<ActionHookOutput>('save').templateData.invalid).toBe(false);

    await act(async () => lastHookOutput<ActionHookOutput>('save').onSubmit());

    expect(lastHookOutput<ActionHookOutput>('save').templateData.invalid).toBe(true);
  });

  it('submits from onSubmit only when actionType is submit', async () => {
    const submits: FormSubmitEvent[] = [];
    await mountForm(
      {
        formDef: rootLayout([
          { uid: 'plain', kind: 'action', type: 'button', actionType: 'button', label: 'Plain' },
          { uid: 'save', kind: 'action', type: 'button', actionType: 'submit', label: 'Save' },
        ]),
        widgetLoaders: stubWidgetLoaders,
        data: {},
      },
      { formSubmit: (event) => submits.push(event) },
    );

    await act(async () => lastHookOutput<ActionHookOutput>('plain').onSubmit());
    expect(submits).toHaveLength(0);

    await act(async () => lastHookOutput<ActionHookOutput>('save').onSubmit());
    expect(submits).toHaveLength(1);
  });
});

describe('useDisplayWidget', () => {
  it('carries the calculated widget and its props in templateData', async () => {
    await mountForm({
      formDef: rootLayout([
        { uid: 'greeting', kind: 'display', type: 'text', props: { text: 'Hi {{$form.name}}' } },
      ]),
      widgetLoaders: stubWidgetLoaders,
      data: { name: 'Ada' },
    });

    expect(lastHookOutput<DisplayHookOutput>('greeting').templateData).toMatchObject({
      uid: 'greeting',
      kind: 'display',
      type: 'text',
      text: 'Hi Ada',
    });
  });

  it('returns an empty templateData while the widget has never been visible', async () => {
    const formDef = rootLayout([
      {
        uid: 'greeting',
        kind: 'display',
        type: 'text',
        props: { text: 'Hi' },
        exclude: { when: '$form.hideGreeting === true' },
      },
    ]);
    const { setData } = await mountWidgetsWithoutLayout(formDef, { hideGreeting: true }, [
      'greeting',
    ]);
    expect(lastHookOutput<DisplayHookOutput>('greeting').templateData).toEqual({});

    await setData({ hideGreeting: false });

    expect(lastHookOutput<DisplayHookOutput>('greeting').templateData.text).toBe('Hi');
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

  it('uses an id from useId when formName is not set', async () => {
    const mounted = await mountForm({
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: stubWidgetLoaders,
      data: {},
    });

    // The client formats of useId in React 18 and 19.0, in React 19.1, and from React 19.2.
    expect(mounted.container.querySelector('form')?.id).toMatch(
      /^(:r[0-9a-z]+:|\u00abr[0-9a-z]+\u00bb|_r_[0-9a-z]+_)$/,
    );
  });

  it('uses formName as the form element id and as the store formName', async () => {
    const recorder = formNameRecorder();
    const mounted = await mountForm({
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: stubWidgetLoaders,
      data: {},
      formName: 'signup',
      middlewares: [recorder.middleware],
    });

    expect(mounted.container.querySelector('form')?.id).toBe('signup');
    expect(recorder.formNames.at(-1)).toBe('signup');
  });

  it('gives two forms on one page different ids', async () => {
    const config = (): FormInitConfig<StubComponent> => ({
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: stubWidgetLoaders,
      data: {},
    });
    const mounted = await render(
      <>
        <FormComponent config={config()} validators={noopValidators} />
        <FormComponent config={config()} validators={noopValidators} />
      </>,
    );

    const ids = Array.from(mounted.querySelectorAll('form')).map((form) => form.id);
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });
});

describe('a formDef changed on the same config object', () => {
  it('renders nothing new until a new config object arrives', async () => {
    const config: FormInitConfig<StubComponent> = {
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: stubWidgetLoaders,
      data: {},
    };
    const mounted = await render(<FormComponent config={config} validators={noopValidators} />);
    const renderedInputIds = () =>
      Array.from(mounted.querySelectorAll('input')).map((input) => input.id);
    expect(renderedInputIds()).toEqual(['firstName']);

    // React compares the config object identity only.
    config.formDef = rootLayout([
      { uid: 'email', kind: 'input', type: 'textinput', path: 'email' },
    ]);
    await act(async () =>
      root?.render(<FormComponent config={config} validators={noopValidators} />),
    );

    expect(renderedInputIds()).toEqual(['firstName']);

    const newConfig = { ...config };
    await act(async () =>
      root?.render(<FormComponent config={newConfig} validators={noopValidators} />),
    );

    expect(renderedInputIds()).toEqual(['email']);
  });
});
