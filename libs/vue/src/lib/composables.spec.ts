// @vitest-environment jsdom
import {
  type Action,
  type FormHealth,
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
import {
  type App,
  type Component,
  createApp,
  defineComponent,
  h,
  nextTick,
  ref,
  shallowRef,
  toRaw,
} from 'vue';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import FormComponent from './FormComponent.vue';
import type { FormComponentHandle } from './FormComponent.types';
import { VueFormContext } from './VueFormContext';
import WidgetRenderer from './WidgetRenderer.vue';
import { provideFormContext } from './provideFormContext';
import {
  type ActionComposableOutput,
  type DisplayComposableOutput,
  type InputComposableOutput,
  type LayoutComposableOutput,
  composableOutputs,
  lastComposableOutput,
  noopValidators,
  stubWidgetLoaders,
} from './ssr.fixture';

/**
 * Checks what the widget composables return, with a real store and the stub widgets of the
 * fixture.
 *
 * Run: npx vitest run --config libs/vue/vite.config.ts src/lib/composables.spec.ts
 */

type StubComponent = Component<WithWidget>;

/** Fails an empty value when the validator descriptor has `required: true`. */
const requiredValidators: ValidatorFn<{ required?: boolean }> = (validator) => ({
  '~standard': {
    version: 1,
    vendor: 'composables-spec',
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

let app: App | null = null;
let container: HTMLDivElement | null = null;

const mount = async (rootComponent: Component) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  app = createApp(rootComponent);
  app.mount(container);
  await nextTick();
  return container;
};

const mountForm = async (
  config: FormInitConfig<StubComponent>,
  options: {
    validators?: ValidatorFn<any>;
    onFormSubmit?: (event: FormSubmitEvent) => void;
  } = {},
) => {
  const formHandle = ref<FormComponentHandle | null>(null);
  const mounted = await mount({
    setup: () => () =>
      h(FormComponent, {
        ref: formHandle,
        config,
        validators: options.validators ?? noopValidators,
        onFormSubmit: options.onFormSubmit,
      }),
  });
  const setData = async (data: Record<string, unknown>) => {
    formHandle.value?.setData(data);
    await nextTick();
  };
  const submit = async () => {
    mounted.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await nextTick();
  };
  return { container: mounted, setData, submit };
};

/**
 * Renders the widgets with these uids directly inside a form context, without their layout. A
 * layout removes a hidden child, so this is the only way to see what a composable returns while
 * its widget is hidden.
 */
const mountWidgetsWithoutLayout = async (
  formDef: FormInitConfig<StubComponent>['formDef'],
  data: Record<string, unknown>,
  uids: string[],
) => {
  const context = new VueFormContext();
  context.initialize(stubWidgetLoaders, [], noopValidators, 'eager', {}, undefined, {});
  context.store.dispatch({ type: 'INITIALIZE', payload: { formName: 'composables', formDef } });
  context.store.dispatch({ type: 'SET_DATA', payload: { data } });
  const sources = context.store.getState().resolvedSources;
  await mount(
    defineComponent({
      setup() {
        provideFormContext(context);
        return () =>
          uids.map((uid) =>
            h(WidgetRenderer, { key: uid, widget: sources[uid] as NonFunctionWidget<string> }),
          );
      },
    }),
  );
  const setData = async (nextData: Record<string, unknown>) => {
    context.store.dispatch({ type: 'SET_DATA', payload: { data: nextData } });
    await nextTick();
  };
  return { setData };
};

const childUids = (output: LayoutComposableOutput) =>
  output.children.value.map((child) => child.uid);

beforeAll(async () => {
  // Preloaded widgets render in the first render, so no spec waits for a dynamic import.
  await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
});

afterEach(() => {
  app?.unmount();
  app = null;
  container?.remove();
  container = null;
  composableOutputs.length = 0;
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

    const output = lastComposableOutput<InputComposableOutput<string>>('firstName');
    expect(output.errors.value).toEqual([]);
    expect(output.isTouched.value).toBe(false);
  });

  it('returns the errors of a required empty input after a submit', async () => {
    const { submit } = await mountForm(
      { formDef: requiredFirstName, widgetLoaders: stubWidgetLoaders, data: {} },
      { validators: requiredValidators },
    );

    await submit();

    const output = lastComposableOutput<InputComposableOutput<string>>('firstName');
    expect(output.errors.value).toEqual(['required']);
    expect(output.isTouched.value).toBe(true);
  });

  it('returns value, errors and isTouched next to templateData, not inside it', async () => {
    await mountForm({
      formDef: rootLayout([{ ...firstNameInput, label: 'First name' }]),
      widgetLoaders: stubWidgetLoaders,
      data: { firstName: 'Ada' },
    });

    const output = lastComposableOutput<InputComposableOutput<string>>('firstName');
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
    expect(output.uid.value).toBe('firstName');
    expect(output.value.value).toBe('Ada');
    expect(output.templateData.value).not.toHaveProperty('value');
    expect(output.templateData.value).not.toHaveProperty('errors');
    expect(output.templateData.value).not.toHaveProperty('isTouched');
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

    const { templateData } = lastComposableOutput<InputComposableOutput<string>>('firstName');
    expect(templateData.value).toMatchObject({
      uid: 'firstName',
      kind: 'input',
      type: 'textinput',
      path: 'firstName',
      label: 'First name',
      hint: 'Hello Ada',
      lang: 'en-GB',
    });
    expect(toRaw(templateData.value.deps)).toBe(dependencies);
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
    const output = lastComposableOutput<InputComposableOutput>('firstName');

    expect(output.templateData.value.label).toBe('Legal name');

    await setData({ age: 10 });

    expect(output.templateData.value.label).toBe('First name');
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
    const output = lastComposableOutput<InputComposableOutput<string>>('firstName');
    expect(output.templateData.value.label).toBe('Name: Ada');

    await setData({ firstName: 'Grace', hideFirstName: true });

    expect(output.value.value).toBe('Grace');
    expect(output.templateData.value.label).toBe('Name: Ada');
  });

  it('updates templateData.lang when the language changes', async () => {
    const translator = identityTranslator('en-US');
    await mountForm({
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: stubWidgetLoaders,
      data: {},
      localization: translator,
    });
    const output = lastComposableOutput<InputComposableOutput>('firstName');
    expect(output.templateData.value.lang).toBe('en-US');

    translator.setLang('es');
    await nextTick();

    expect(output.templateData.value.lang).toBe('es');
  });
});

describe('useInputWidget for a repeater', () => {
  it('lists one row node per data row, with the row index in the uid', async () => {
    await mountForm({
      formDef: rootLayout([usersRepeater()]),
      widgetLoaders: stubWidgetLoaders,
      data: { users: [{ name: 'Ada' }, { name: 'Linus' }] },
    });

    const { templateData } = lastComposableOutput<InputComposableOutput<unknown[]>>('users');
    expect(templateData.value.rows?.map((row) => row.uid)).toEqual(['userRow[0]', 'userRow[1]']);
  });

  it('keeps the last rows while the repeater is hidden', async () => {
    const formDef = rootLayout([usersRepeater({ exclude: { when: '$form.hideUsers === true' } })]);
    const { setData } = await mountWidgetsWithoutLayout(
      formDef,
      { users: [{ name: 'Ada' }, { name: 'Linus' }] },
      ['users'],
    );

    await setData({ users: [{ name: 'Ada' }], hideUsers: true });

    const output = lastComposableOutput<InputComposableOutput<unknown[]>>('users');
    expect(output.value.value).toEqual([{ name: 'Ada' }]);
    expect(output.templateData.value.rows?.map((row) => row.uid)).toEqual([
      'userRow[0]',
      'userRow[1]',
    ]);
  });
});

describe('useLayoutWidget', () => {
  it('lists the children of a repeater row with the row index in the uid and the path', async () => {
    await mountForm({
      formDef: rootLayout([usersRepeater()]),
      widgetLoaders: stubWidgetLoaders,
      data: { users: [{ name: 'Ada' }, { name: 'Linus' }] },
    });

    const secondRow = lastComposableOutput<LayoutComposableOutput>('userRow[1]');
    expect(secondRow.children.value).toEqual([
      expect.objectContaining({ uid: 'name[1]', path: 'users.1.name' }),
    ]);
    expect(lastComposableOutput<InputComposableOutput<string>>('name[1]').value.value).toBe(
      'Linus',
    );
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
    expect(childUids(lastComposableOutput('root'))).toEqual(['firstName', 'nickname']);

    await setData({ hideNickname: true });

    expect(childUids(lastComposableOutput('root'))).toEqual(['firstName']);
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
    expect(childUids(lastComposableOutput('box'))).toEqual(['firstName', 'nickname']);

    // A visible layout would drop the hidden nickname.
    await setData({ hideBox: true, hideNickname: true });

    expect(childUids(lastComposableOutput('box'))).toEqual(['firstName', 'nickname']);
  });
});

describe('useActionWidget', () => {
  const requiredForm = rootLayout([
    { ...firstNameInput, validator: { required: true } },
    { uid: 'save', kind: 'action', type: 'button', actionType: 'submit', label: 'Save' },
  ]);

  it('sets templateData.invalid and the invalid ref only after a submit of an invalid form', async () => {
    const { submit } = await mountForm(
      { formDef: requiredForm, widgetLoaders: stubWidgetLoaders, data: {} },
      { validators: requiredValidators },
    );
    const output = lastComposableOutput<ActionComposableOutput>('save');
    expect(output.templateData.value.invalid).toBe(false);
    expect(output.invalid.value).toBe(false);

    await submit();

    expect(output.templateData.value.invalid).toBe(true);
    expect(output.invalid.value).toBe(true);
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

    expect(
      lastComposableOutput<DisplayComposableOutput>('greeting').templateData.value,
    ).toMatchObject({ uid: 'greeting', kind: 'display', type: 'text', text: 'Hi Ada' });
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
    const output = lastComposableOutput<DisplayComposableOutput>('greeting');
    expect(output.templateData.value).toEqual({});

    await setData({ hideGreeting: false });

    expect(output.templateData.value.text).toBe('Hi');
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

    expect(mounted.container.querySelector('form')?.id).toMatch(/^v-[0-9a-z-]+$/);
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
    const mounted = await mount({
      setup: () => () => [
        h(FormComponent, { config: config(), validators: noopValidators }),
        h(FormComponent, { config: config(), validators: noopValidators }),
      ],
    });

    const ids = Array.from(mounted.querySelectorAll('form')).map((form) => form.id);
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
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
    const formHandle = ref<FormComponentHandle | null>(null);
    const validators = ref<ValidatorFn<any>>(noopValidators);
    const hostRenders = ref(0);
    await mount({
      setup: () => () => {
        // Read so that a change renders the host again.
        void hostRenders.value;
        return h(FormComponent, { ref: formHandle, config, validators: validators.value });
      },
    });
    formHandle.value?.setData({ firstName: 'Grace' });
    await nextTick();

    hostRenders.value += 1;
    validators.value = noopValidators;
    await nextTick();

    expect(lastComposableOutput<InputComposableOutput<string>>('firstName').value.value).toBe(
      'Grace',
    );
    expect(initializeActions).toHaveLength(1);

    validators.value = otherValidators;
    await nextTick();

    expect(lastComposableOutput<InputComposableOutput<string>>('firstName').value.value).toBe(
      'Ada',
    );
    expect(initializeActions).toHaveLength(2);
  });
});

describe('a new config object', () => {
  it('emits an ok health once more, and a render with the same config emits none', async () => {
    const healths: FormHealth[] = [];
    // A shallowRef passes the plain config object, as an app does.
    const config = shallowRef<FormInitConfig<StubComponent>>({
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: stubWidgetLoaders,
      data: {},
    });
    const hostRenders = ref(0);
    await mount({
      setup: () => () => {
        // Read so that a change renders the host again.
        void hostRenders.value;
        return h(FormComponent, {
          config: config.value,
          validators: noopValidators,
          onFormHealth: (health: FormHealth) => healths.push(health),
        });
      },
    });
    expect(healths).toEqual([{ status: 'ok' }]);

    hostRenders.value += 1;
    await nextTick();

    expect(healths).toEqual([{ status: 'ok' }]);

    config.value = { ...config.value };
    await nextTick();

    expect(healths).toEqual([{ status: 'ok' }, { status: 'ok' }]);
  });
});
