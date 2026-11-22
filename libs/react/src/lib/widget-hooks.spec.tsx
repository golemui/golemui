// @vitest-environment jsdom
import {
  type Action,
  errorCodes,
  FormContext,
  type FormHealth,
  type FormInitConfig,
  type FormSubmitEvent,
  identityTranslator,
  type Middleware,
  preloadFormWidgets,
  type State,
  type ValidatorFn,
  type WithWidget,
} from '@golemui/core';
import {
  act,
  createRef,
  type ReactElement,
  startTransition,
  StrictMode,
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, onTestFinished, vi } from 'vitest';
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
  storeRecorder,
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
        <WidgetRenderer key={uid} widget={sources[uid]} />
      ))}
    </ReactFormContextProvider>,
  );
  const setData = (nextData: Record<string, unknown>) =>
    act(async () => context.store.dispatch({ type: 'SET_DATA', payload: { data: nextData } }));
  return { setData };
};

const childUids = (output: LayoutHookOutput) => output.children.map((child) => child.uid);

const initializeCount = (actions: Action[]) =>
  actions.filter((action) => action.type === 'INITIALIZE').length;

const customerConfig = (
  firstName: string,
  middleware: Middleware<State, Action>,
): FormInitConfig<StubComponent> => ({
  formDef: rootLayout([firstNameInput]),
  widgetLoaders: stubWidgetLoaders,
  data: { firstName },
  middlewares: [middleware],
});

type HostProps = {
  config: FormInitConfig<StubComponent>;
  validators?: ValidatorFn<any>;
  formHealth?: (health: FormHealth) => void;
  /** Runs in the effect of the host that follows a render with a new config or new validators. */
  onNewConfig?: (form: FormComponentHandle) => void;
};

/**
 * A host that calls the form handle from an effect, like a host that fills in a saved draft each
 * time it shows the form of another customer.
 */
function Host({ config, validators = noopValidators, formHealth, onNewConfig }: HostProps) {
  const formRef = useRef<FormComponentHandle>(null);
  useEffect(() => {
    if (formRef.current) {
      onNewConfig?.(formRef.current);
    }
    // The effect runs for a new config or new validators only, like the effect of such a host.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, validators]);
  return (
    <FormComponent ref={formRef} config={config} validators={validators} formHealth={formHealth} />
  );
}

const setDraft = (form: FormComponentHandle) => form.setData({ firstName: 'Linus' });

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
      'domId',
      'errors',
      'formName',
      'injectValidationIssues',
      'isTouched',
      'onBlur',
      'onFilter',
      'onRowRemoved',
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

  it('validates the form once for onClick followed by onSubmit', async () => {
    const actionTypes: string[] = [];
    const recordActions: Middleware<State, Action> = () => (next) => (action) => {
      actionTypes.push(action.type);
      next(action);
    };
    await mountForm(
      {
        formDef: requiredForm,
        widgetLoaders: stubWidgetLoaders,
        data: {},
        middlewares: [recordActions],
      },
      { validators: requiredValidators },
    );
    actionTypes.length = 0;

    // A widget set with no form element calls onClick and then onSubmit, like a DOM button
    // inside a form does with the click and the native submit.
    await act(async () => lastHookOutput<ActionHookOutput>('save').onClick());
    expect(actionTypes).not.toContain('VALIDATE_ALL');

    await act(async () => lastHookOutput<ActionHookOutput>('save').onSubmit());
    expect(actionTypes.filter((type) => type === 'VALIDATE_ALL')).toHaveLength(1);
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

  it('uses the formName of a new config object', async () => {
    const recorder = formNameRecorder();
    const config: FormInitConfig<StubComponent> = {
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: stubWidgetLoaders,
      data: {},
      formName: 'signup',
      middlewares: [recorder.middleware],
    };
    const mounted = await render(<FormComponent config={config} validators={noopValidators} />);

    await act(async () =>
      root?.render(
        <FormComponent config={{ ...config, formName: 'checkout' }} validators={noopValidators} />,
      ),
    );

    expect(mounted.querySelector('form')?.id).toBe('checkout');
    expect(recorder.formNames.at(-1)).toBe('checkout');
    expect(lastHookOutput<InputHookOutput>('firstName').domId).toBe('checkout-firstName');
  });

  it('uses the generated id for a new config object with no formName, and keeps it', async () => {
    const recorder = formNameRecorder();
    const configOf = (formName?: string): FormInitConfig<StubComponent> => ({
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: stubWidgetLoaders,
      data: {},
      formName,
      middlewares: [recorder.middleware],
    });
    const form = (config: FormInitConfig<StubComponent>) => (
      <FormComponent config={config} validators={noopValidators} />
    );
    const mounted = await render(form(configOf('signup')));
    const formId = () => mounted.querySelector('form')?.id;

    await act(async () => root?.render(form(configOf())));
    const generatedId = formId();

    expect(generatedId).toBeTruthy();
    expect(generatedId).not.toBe('signup');
    expect(recorder.formNames.at(-1)).toBe(generatedId);

    await act(async () => root?.render(form(configOf())));

    expect(formId()).toBe(generatedId);
    expect(recorder.formNames.at(-1)).toBe(generatedId);
  });

  it('uses the id generated at mount again after a config object with a formName', async () => {
    const recorder = formNameRecorder();
    const configOf = (formName?: string): FormInitConfig<StubComponent> => ({
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: stubWidgetLoaders,
      data: {},
      formName,
      middlewares: [recorder.middleware],
    });
    const form = (config: FormInitConfig<StubComponent>) => (
      <FormComponent config={config} validators={noopValidators} />
    );
    const mounted = await render(form(configOf()));
    const formId = () => mounted.querySelector('form')?.id;
    const idGeneratedAtMount = formId();
    expect(idGeneratedAtMount).toBeTruthy();

    await act(async () => root?.render(form(configOf('signup'))));

    expect(formId()).toBe('signup');

    await act(async () => root?.render(form(configOf())));

    expect(formId()).toBe(idGeneratedAtMount);
    expect(recorder.formNames.at(-1)).toBe(idGeneratedAtMount);
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

describe('a new validators object', () => {
  it('reinitializes the form with the config data, and the same validators object does not', async () => {
    const initializeActions: Action[] = [];
    const recordInitialize: Middleware<State, Action> = () => (next) => (action) => {
      if (action.type === 'INITIALIZE') {
        initializeActions.push(action);
      }
      next(action);
    };
    const config: FormInitConfig<StubComponent> = {
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: stubWidgetLoaders,
      data: { firstName: 'Ada' },
      middlewares: [recordInitialize],
    };
    const otherValidators: ValidatorFn<any> = (validator) => noopValidators(validator);
    const formRef = createRef<FormComponentHandle>();
    await render(<FormComponent ref={formRef} config={config} validators={noopValidators} />);
    await act(async () => formRef.current?.setData({ firstName: 'Grace' }));

    await act(async () =>
      root?.render(<FormComponent ref={formRef} config={config} validators={noopValidators} />),
    );

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Grace');
    expect(initializeActions).toHaveLength(1);

    await act(async () =>
      root?.render(<FormComponent ref={formRef} config={config} validators={otherValidators} />),
    );

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Ada');
    expect(initializeActions).toHaveLength(2);
  });

  it('shows the draft that a useEffect of the host sets with setData after new validators', async () => {
    const stores = storeRecorder();
    const config = customerConfig('Ada', stores.middleware);
    const newValidators: ValidatorFn<any> = (validator) => noopValidators(validator);
    await render(<Host config={config} />);
    const oldStoreActionCount = stores.actionsByStore[0].length;

    await act(async () =>
      root?.render(<Host config={config} validators={newValidators} onNewConfig={setDraft} />),
    );

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Linus');
    expect(stores.actionsByStore).toHaveLength(2);
    expect(stores.actionsByStore[0].slice(oldStoreActionCount)).toEqual([]);
    expect(initializeCount(stores.actionsByStore[1])).toBe(1);
  });
});

describe('a new config object', () => {
  const firstNameConfig = (): FormInitConfig<StubComponent> => ({
    formDef: rootLayout([firstNameInput]),
    widgetLoaders: stubWidgetLoaders,
    data: {},
  });

  it('emits an ok health once more, and a render with the same config emits none', async () => {
    const healths: FormHealth[] = [];
    const form = (config: FormInitConfig<StubComponent>) => (
      <FormComponent
        config={config}
        validators={noopValidators}
        formHealth={(health) => {
          healths.push(health);
        }}
      />
    );
    const config = firstNameConfig();
    await render(form(config));
    expect(healths).toEqual([{ status: 'ok' }]);

    await act(async () => root?.render(form(config)));

    expect(healths).toEqual([{ status: 'ok' }]);

    await act(async () => root?.render(form({ ...config })));

    expect(healths).toEqual([{ status: 'ok' }, { status: 'ok' }]);
  });

  it('follows the language of the new translator and ignores the old one', async () => {
    const firstTranslator = identityTranslator('en-US');
    const secondTranslator = identityTranslator('en-US');
    const mounted = await render(
      <FormComponent
        config={{ ...firstNameConfig(), localization: firstTranslator }}
        validators={noopValidators}
      />,
    );
    await act(async () =>
      root?.render(
        <FormComponent
          config={{ ...firstNameConfig(), localization: secondTranslator }}
          validators={noopValidators}
        />,
      ),
    );

    await act(async () => firstTranslator.setLang('ar'));

    expect(mounted.querySelector('form')?.dir).toBe('ltr');

    await act(async () => secondTranslator.setLang('ar'));

    expect(mounted.querySelector('form')?.dir).toBe('rtl');
  });

  it('shows the draft that a useEffect of the host sets with setData after the new config', async () => {
    const oldStores = storeRecorder();
    const newStores = storeRecorder();
    const newConfig = customerConfig('Grace', newStores.middleware);
    await render(<Host config={customerConfig('Ada', oldStores.middleware)} />);
    const oldStoreActionCount = oldStores.actionsByStore[0].length;

    await act(async () => root?.render(<Host config={newConfig} onNewConfig={setDraft} />));

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Linus');
    expect(oldStores.actionsByStore).toHaveLength(1);
    expect(oldStores.actionsByStore[0].slice(oldStoreActionCount)).toEqual([]);
    expect(newStores.actionsByStore).toHaveLength(1);
    expect(initializeCount(newStores.actionsByStore[0])).toBe(1);

    // A render with the same config and the same validators keeps the form and the draft.
    await act(async () => root?.render(<Host config={newConfig} />));

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Linus');
    expect(newStores.actionsByStore).toHaveLength(1);
  });

  it('starts one form and shows the draft that a useEffect of the host sets with setData after the new config, in StrictMode', async () => {
    const oldStores = storeRecorder();
    const newStores = storeRecorder();
    await render(
      <StrictMode>
        <Host config={customerConfig('Ada', oldStores.middleware)} />
      </StrictMode>,
    );
    const oldStoreActionCounts = oldStores.actionsByStore.map((actions) => actions.length);

    await act(async () =>
      root?.render(
        <StrictMode>
          <Host config={customerConfig('Grace', newStores.middleware)} onNewConfig={setDraft} />
        </StrictMode>,
      ),
    );

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Linus');
    const oldStoreActionsAfterNewConfig = oldStores.actionsByStore.map((actions, index) =>
      actions.slice(oldStoreActionCounts[index]),
    );
    expect(oldStoreActionsAfterNewConfig.flat()).toEqual([]);
    expect(newStores.actionsByStore.map(initializeCount)).toEqual([1]);
  });

  it('shows the meta that a useEffect of the host sets with setMeta after the new config', async () => {
    const oldStores = storeRecorder();
    const newStores = storeRecorder();
    const customerMetaConfig = (
      customer: string,
      middleware: Middleware<State, Action>,
    ): FormInitConfig<StubComponent> => ({
      formDef: rootLayout([
        {
          uid: 'customer',
          kind: 'display',
          type: 'text',
          props: { text: 'Customer {{$meta.customer}}' },
        },
      ]),
      widgetLoaders: stubWidgetLoaders,
      data: {},
      meta: { customer },
      middlewares: [middleware],
    });
    await render(<Host config={customerMetaConfig('Ada', oldStores.middleware)} />);
    const oldStoreActionCount = oldStores.actionsByStore[0].length;

    await act(async () =>
      root?.render(
        <Host
          config={customerMetaConfig('Grace', newStores.middleware)}
          onNewConfig={(form) => form.setMeta({ customer: 'Linus' })}
        />,
      ),
    );

    expect(lastHookOutput<DisplayHookOutput>('customer').templateData.text).toBe('Customer Linus');
    expect(oldStores.actionsByStore[0].slice(oldStoreActionCount)).toEqual([]);
    expect(newStores.actionsByStore).toHaveLength(1);
  });

  const draftError: FormHealth = {
    status: 'errored',
    message: 'The draft could not be loaded',
    code: 1001,
  };

  const startResults = [
    {
      startResult: 'ok',
      formDef: rootLayout([firstNameInput]),
      startHealth: { status: 'ok' },
    },
    {
      startResult: 'an error',
      formDef: rootLayout([firstNameInput, firstNameInput]),
      startHealth: {
        status: 'errored',
        code: errorCodes.initializeUidCollisionError,
        message: expect.stringContaining('Duplicate UID "firstName"'),
      },
    },
  ];

  it.each(startResults)(
    'emits the start health of the new form ($startResult) before the health that a useEffect of the host sets',
    async ({ formDef, startHealth }) => {
      // The form logs an errored health, which is expected here.
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      onTestFinished(() => consoleError.mockRestore());
      const healths: FormHealth[] = [];
      const recordHealth = (health: FormHealth) => {
        healths.push(health);
      };
      const oldStores = storeRecorder();
      const newStores = storeRecorder();
      await render(
        <Host config={customerConfig('Ada', oldStores.middleware)} formHealth={recordHealth} />,
      );
      const oldStoreActionCount = oldStores.actionsByStore[0].length;

      await act(async () =>
        root?.render(
          <Host
            config={{ ...customerConfig('Grace', newStores.middleware), formDef }}
            formHealth={recordHealth}
            onNewConfig={(form) => form.setHealth(draftError)}
          />,
        ),
      );

      expect(healths).toEqual([{ status: 'ok' }, startHealth, draftError]);
      expect(oldStores.actionsByStore[0].slice(oldStoreActionCount)).toEqual([]);
    },
  );

  it('replaces the form with the data of the new config after a setData call that runs before the new config renders', async () => {
    const oldStores = storeRecorder();
    const newStores = storeRecorder();
    const oldConfig = customerConfig('Ada', oldStores.middleware);
    const newConfig = customerConfig('Grace', newStores.middleware);
    function NextCustomerHost() {
      const [config, setConfig] = useState(oldConfig);
      const formRef = useRef<FormComponentHandle>(null);
      // React renders the new config after this handler returns, so setData reaches the old form.
      const showNextCustomer = () => {
        setConfig(newConfig);
        formRef.current?.setData({ firstName: 'Linus' });
      };
      return (
        <>
          <button type="button" id="next-customer" onClick={showNextCustomer}>
            Next customer
          </button>
          <FormComponent ref={formRef} config={config} validators={noopValidators} />
        </>
      );
    }
    const mounted = await render(<NextCustomerHost />);

    await act(async () => mounted.querySelector<HTMLButtonElement>('#next-customer')?.click());

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Grace');
    expect(oldStores.actionsByStore[0]).toContainEqual({
      type: 'SET_DATA',
      payload: { data: { firstName: 'Linus' } },
    });
    expect(newStores.actionsByStore).toHaveLength(1);
  });

  it('starts one form for each render of a host that passes a new config object each time', async () => {
    const stores = storeRecorder();
    function InlineConfigHost({ firstName }: { firstName: string }) {
      return (
        <FormComponent
          config={customerConfig(firstName, stores.middleware)}
          validators={noopValidators}
        />
      );
    }
    await render(<InlineConfigHost firstName="Ada" />);

    await act(async () => root?.render(<InlineConfigHost firstName="Grace" />));
    await act(async () => root?.render(<InlineConfigHost firstName="Linus" />));

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Linus');
    expect(stores.actionsByStore.map(initializeCount)).toEqual([1, 1, 1]);
  });

  it('starts one form for a new config whose form has a widget that throws in render', async () => {
    // The error boundary logs the caught error, which is expected here.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    onTestFinished(() => consoleError.mockRestore());
    const ThrowingWidget = (): never => {
      throw new Error('render failed');
    };
    const widgetLoaders = {
      ...stubWidgetLoaders,
      throwing: async (): Promise<StubComponent> => ThrowingWidget,
    };
    await preloadFormWidgets({ widgetLoaders });
    const newStores = storeRecorder();
    await render(
      <FormComponent
        config={customerConfig('Ada', storeRecorder().middleware)}
        validators={noopValidators}
      />,
    );

    await act(async () =>
      root?.render(
        <FormComponent
          config={{
            ...customerConfig('Grace', newStores.middleware),
            formDef: rootLayout([
              firstNameInput,
              { uid: 'broken', kind: 'input', type: 'throwing', path: 'broken' },
            ]),
            widgetLoaders,
          }}
          validators={noopValidators}
        />,
      ),
    );

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Grace');
    expect(newStores.actionsByStore.map(initializeCount)).toEqual([1]);
  });

  it('starts no form while a transition with the new config waits, and one form after it', async () => {
    let isResolved = false;
    let resolveDetails: () => void = () => undefined;
    const detailsPromise = new Promise<void>((resolve) => {
      resolveDetails = resolve;
    });
    /** Suspends until the details are loaded. */
    function CustomerDetails() {
      if (!isResolved) {
        throw detailsPromise;
      }
      return <p>Details</p>;
    }
    const oldStores = storeRecorder();
    const newStores = storeRecorder();
    await render(
      <Suspense fallback={<p>Loading</p>}>
        <Host config={customerConfig('Ada', oldStores.middleware)} />
      </Suspense>,
    );
    const oldStoreActionCount = oldStores.actionsByStore[0].length;

    await act(async () =>
      startTransition(() => {
        root?.render(
          <Suspense fallback={<p>Loading</p>}>
            <Host config={customerConfig('Grace', newStores.middleware)} onNewConfig={setDraft} />
            <CustomerDetails />
          </Suspense>,
        );
      }),
    );

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Ada');
    expect(newStores.actionsByStore).toEqual([]);

    await act(async () => {
      isResolved = true;
      resolveDetails();
    });

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Linus');
    expect(newStores.actionsByStore.map(initializeCount)).toEqual([1]);
    expect(oldStores.actionsByStore[0].slice(oldStoreActionCount)).toEqual([]);
  });

  it('gives a later call through the handle that a host effect read for the new config to the new form', async () => {
    const oldStores = storeRecorder();
    const newStores = storeRecorder();
    let handleOfEffect: FormComponentHandle | undefined;
    await render(<Host config={customerConfig('Ada', oldStores.middleware)} />);
    const oldStoreActionCount = oldStores.actionsByStore[0].length;

    // A host reads the handle in its effect, loads a draft, and fills it in later.
    await act(async () =>
      root?.render(
        <Host
          config={customerConfig('Grace', newStores.middleware)}
          onNewConfig={(form) => {
            handleOfEffect = form;
          }}
        />,
      ),
    );
    await act(async () => handleOfEffect?.setData({ firstName: 'Linus' }));

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Linus');
    expect(oldStores.actionsByStore[0].slice(oldStoreActionCount)).toEqual([]);
  });

  it('keeps the handle that a host effect read for the new config in the ref of the host', async () => {
    const formRef = createRef<FormComponentHandle>();
    let handleOfEffect: FormComponentHandle | null = null;
    /** Reads the handle in the effect that runs for a new config. */
    function ReadingHost({ config }: { config: FormInitConfig<StubComponent> }) {
      useEffect(() => {
        handleOfEffect = formRef.current;
      }, [config]);
      return <FormComponent ref={formRef} config={config} validators={noopValidators} />;
    }
    await render(<ReadingHost config={customerConfig('Ada', storeRecorder().middleware)} />);
    const handleOfOldForm = formRef.current;

    await act(async () =>
      root?.render(<ReadingHost config={customerConfig('Grace', storeRecorder().middleware)} />),
    );

    expect(handleOfEffect).not.toBe(handleOfOldForm);
    expect(formRef.current).toBe(handleOfEffect);
  });

  it('gives a late call through the handle of the old form to the old store', async () => {
    const formRef = createRef<FormComponentHandle>();
    const oldStores = storeRecorder();
    const newStores = storeRecorder();
    const lateDraft = { type: 'SET_DATA', payload: { data: { firstName: 'Linus' } } };
    await render(
      <FormComponent
        ref={formRef}
        config={customerConfig('Ada', oldStores.middleware)}
        validators={noopValidators}
      />,
    );
    // A host keeps the handle while it loads a draft for this customer.
    const handleOfOldForm = formRef.current;

    await act(async () =>
      root?.render(
        <FormComponent
          ref={formRef}
          config={customerConfig('Grace', newStores.middleware)}
          validators={noopValidators}
        />,
      ),
    );
    await act(async () => handleOfOldForm?.setData({ firstName: 'Linus' }));

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Grace');
    expect(oldStores.actionsByStore[0]).toContainEqual(lateDraft);
    expect(newStores.actionsByStore[0]).not.toContainEqual(lateDraft);
  });

  it('gives a call from an effect cleanup of the host to the old form', async () => {
    const oldStores = storeRecorder();
    const newStores = storeRecorder();
    const emptyData = { type: 'SET_DATA', payload: { data: {} } };
    /** Empties the old form in the cleanup of its effect. */
    function ResettingHost({ config }: { config: FormInitConfig<StubComponent> }) {
      const formRef = useRef<FormComponentHandle>(null);
      useEffect(() => {
        const form = formRef.current;
        return () => form?.setData({});
      }, [config]);
      return <FormComponent ref={formRef} config={config} validators={noopValidators} />;
    }
    await render(<ResettingHost config={customerConfig('Ada', oldStores.middleware)} />);

    await act(async () =>
      root?.render(<ResettingHost config={customerConfig('Grace', newStores.middleware)} />),
    );

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Grace');
    expect(oldStores.actionsByStore[0]).toContainEqual(emptyData);
    expect(newStores.actionsByStore[0]).not.toContainEqual(emptyData);
  });

  it('calls a callback ref of the host again for the form of a new config', async () => {
    const newStores = storeRecorder();
    // A callback ref with one identity, which fills in the draft of each form that it gets.
    const fillInDraft = (form: FormComponentHandle | null) => {
      form?.setData({ firstName: 'Linus' });
    };
    await render(
      <FormComponent
        ref={fillInDraft}
        config={customerConfig('Ada', storeRecorder().middleware)}
        validators={noopValidators}
      />,
    );

    await act(async () =>
      root?.render(
        <FormComponent
          ref={fillInDraft}
          config={customerConfig('Grace', newStores.middleware)}
          validators={noopValidators}
        />,
      ),
    );

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Linus');
    expect(newStores.actionsByStore[0]).toContainEqual({
      type: 'SET_DATA',
      payload: { data: { firstName: 'Linus' } },
    });
  });

  it('applies two calls of a host effect after the new config in call order', async () => {
    const newStores = storeRecorder();
    await render(<Host config={customerConfig('Ada', storeRecorder().middleware)} />);

    await act(async () =>
      root?.render(
        <Host
          config={customerConfig('Grace', newStores.middleware)}
          onNewConfig={(form) => {
            form.setData({ firstName: 'Linus' });
            form.setData({ firstName: 'Margaret' });
          }}
        />,
      ),
    );

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Margaret');
    const dataOfSetDataActions = newStores.actionsByStore[0].flatMap((action) =>
      action.type === 'SET_DATA' ? [action.payload.data] : [],
    );
    expect(dataOfSetDataActions).toEqual([
      { firstName: 'Grace' },
      { firstName: 'Linus' },
      { firstName: 'Margaret' },
    ]);
  });

  it('gives a call that the formHealth callback makes for the health of a host effect to the new form', async () => {
    // The form logs an errored health, which is expected here.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    onTestFinished(() => consoleError.mockRestore());
    /** Sets a health from its effect, and reacts to an errored health with one more call. */
    function ReactingHost({
      config,
      healthOfEffect,
    }: {
      config: FormInitConfig<StubComponent>;
      healthOfEffect?: FormHealth;
    }) {
      const formRef = useRef<FormComponentHandle>(null);
      useEffect(() => {
        if (healthOfEffect) {
          formRef.current?.setHealth(healthOfEffect);
          formRef.current?.setData({ firstName: 'Linus' });
        }
      }, [config, healthOfEffect]);
      return (
        <FormComponent
          ref={formRef}
          config={config}
          validators={noopValidators}
          formHealth={(health) => {
            if (health.status === 'errored') {
              // The last call in time, so the form shows its data.
              formRef.current?.setData({ firstName: 'Margaret' });
            }
          }}
        />
      );
    }
    await render(<ReactingHost config={customerConfig('Ada', storeRecorder().middleware)} />);

    await act(async () =>
      root?.render(
        <ReactingHost
          config={customerConfig('Grace', storeRecorder().middleware)}
          healthOfEffect={draftError}
        />,
      ),
    );

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Margaret');
  });

  it('does not give a call that a host effect made for one config to the form of the next config', async () => {
    const storesOfNextConfig = storeRecorder();
    const newConfig = customerConfig('Grace', storeRecorder().middleware);
    const nextConfig = customerConfig('Margaret', storesOfNextConfig.middleware);
    const draftOfNewConfig = { firstName: 'Linus' };
    /** Fills in a draft for the new config, and in the same effect replaces that config. */
    function ReplacingHost({ config: configOfProps }: { config: FormInitConfig<StubComponent> }) {
      const [replacingConfig, setReplacingConfig] = useState<FormInitConfig<StubComponent>>();
      const config = replacingConfig ?? configOfProps;
      const formRef = useRef<FormComponentHandle>(null);
      useEffect(() => {
        if (config === newConfig) {
          formRef.current?.setData(draftOfNewConfig);
          setReplacingConfig(nextConfig);
        }
      }, [config]);
      return <FormComponent ref={formRef} config={config} validators={noopValidators} />;
    }
    await render(<ReplacingHost config={customerConfig('Ada', storeRecorder().middleware)} />);

    await act(async () => root?.render(<ReplacingHost config={newConfig} />));

    expect(lastHookOutput<InputHookOutput<string>>('firstName').value).toBe('Margaret');
    expect(storesOfNextConfig.actionsByStore.map(initializeCount)).toEqual([1]);
    expect(storesOfNextConfig.actionsByStore[0]).not.toContainEqual({
      type: 'SET_DATA',
      payload: { data: draftOfNewConfig },
    });
  });

  it('applies a call at once when no new config waits, also after a render with the same config', async () => {
    const stores = storeRecorder();
    const config = customerConfig('Ada', stores.middleware);
    const formRef = createRef<FormComponentHandle>();
    const form = () => <FormComponent ref={formRef} config={config} validators={noopValidators} />;
    await render(form());
    await act(async () => root?.render(form()));
    let lastActionAfterCall: Action | undefined;

    await act(async () => {
      formRef.current?.setData({ firstName: 'Linus' });
      lastActionAfterCall = stores.actionsByStore[0].at(-1);
    });

    expect(lastActionAfterCall).toEqual({
      type: 'SET_DATA',
      payload: { data: { firstName: 'Linus' } },
    });
    expect(stores.actionsByStore).toHaveLength(1);
  });
});
