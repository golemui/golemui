import { Component, inject, signal, type Type, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
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
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FormCoreComponent } from '../components/form/form.component';
import { AngularFormContext } from '../context/form.context';
import { WidgetDirective } from '../directives/widget.directive';
import {
  type ActionAdapter,
  type DisplayAdapter,
  type InputAdapter,
  type LayoutAdapter,
  lastAdapter,
  noopValidators,
  recordedAdapters,
  stubWidgetLoaders,
} from '../ssr.fixture';

/**
 * Checks what the widget adapters hold in templateData, with a real store and the stub widgets
 * of the fixture.
 *
 * Run: npx vitest run --config libs/angular/vite.config.mts src/lib/adapters/adapters.spec.ts
 */

type StubConfig = FormInitConfig<Type<WithWidget>>;

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

@Component({
  standalone: true,
  imports: [FormCoreComponent],
  template: `<gui-core-form [config]="config()" [validators]="validators()" />`,
})
class FormHostComponent {
  config = signal<StubConfig>({ formDef: rootLayout([]), widgetLoaders: stubWidgetLoaders });
  validators = signal<ValidatorFn<any>>(noopValidators);
  form = viewChild.required(FormCoreComponent);
}

@Component({
  standalone: true,
  imports: [FormCoreComponent],
  template: `<gui-core-form [config]="config()" [validators]="validators" />
    <gui-core-form [config]="config()" [validators]="validators" />`,
})
class TwoFormsHostComponent {
  config = signal<StubConfig>({ formDef: rootLayout([]), widgetLoaders: stubWidgetLoaders });
  validators = noopValidators;
}

/** Renders widgets inside a form context, without a layout above them. */
@Component({
  standalone: true,
  imports: [WidgetDirective],
  providers: [AngularFormContext],
  template: `@for (widget of widgets; track widget.uid) {
    <ng-container guiWidget [widget]="widget" />
  }`,
})
class WidgetsWithoutLayoutHostComponent {
  context: AngularFormContext<Type<WithWidget>> = inject(AngularFormContext);
  widgets: NonFunctionWidget<string>[] = [];
}

let fixture: ComponentFixture<unknown> | null = null;

const mountForm = (config: StubConfig, validators: ValidatorFn<any> = noopValidators) => {
  const formFixture = TestBed.createComponent(FormHostComponent);
  fixture = formFixture;
  formFixture.componentInstance.config.set(config);
  formFixture.componentInstance.validators.set(validators);
  formFixture.detectChanges();
  const formElement = () => formFixture.nativeElement.querySelector('form') as HTMLFormElement;
  const setData = (data: Record<string, unknown>) => {
    formFixture.componentInstance.form().setData(data);
    formFixture.detectChanges();
  };
  const submit = () => {
    formElement().dispatchEvent(new Event('submit', { cancelable: true }));
    formFixture.detectChanges();
  };
  const setConfig = (nextConfig: StubConfig) => {
    formFixture.componentInstance.config.set(nextConfig);
    formFixture.detectChanges();
  };
  return { fixture: formFixture, formElement, setData, submit, setConfig };
};

/**
 * Renders the widgets with these uids directly inside a form context, without their layout. A
 * layout removes a hidden child, so this is the only way to see what an adapter holds while its
 * widget is hidden.
 */
const mountWidgetsWithoutLayout = (
  formDef: StubConfig['formDef'],
  data: Record<string, unknown>,
  uids: string[],
) => {
  const hostFixture = TestBed.createComponent(WidgetsWithoutLayoutHostComponent);
  fixture = hostFixture;
  const { context } = hostFixture.componentInstance;
  context.initialize(stubWidgetLoaders, [], noopValidators, 'eager', {}, undefined, {});
  context.store.dispatch({ type: 'INITIALIZE', payload: { formName: 'adapters', formDef } });
  context.store.dispatch({ type: 'SET_DATA', payload: { data } });
  const sources = context.store.getState().resolvedSources;
  hostFixture.componentInstance.widgets = uids.map(
    (uid) => sources[uid] as NonFunctionWidget<string>,
  );
  hostFixture.detectChanges();
  const setData = (nextData: Record<string, unknown>) => {
    context.store.dispatch({ type: 'SET_DATA', payload: { data: nextData } });
    hostFixture.detectChanges();
  };
  return { setData };
};

const childUids = (adapter: LayoutAdapter) =>
  adapter.templateData().children.map((child) => child.uid);

beforeAll(async () => {
  // Preloaded widgets are created in the same change detection pass, so no spec waits for a
  // dynamic import.
  await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
});

afterEach(() => {
  fixture?.destroy();
  fixture = null;
  recordedAdapters.length = 0;
});

describe('InputWidgetAdapter', () => {
  const requiredFirstName = rootLayout([
    { ...firstNameInput, label: 'First name', validator: { required: true } },
    { uid: 'save', kind: 'action', type: 'button', actionType: 'submit', label: 'Save' },
  ]);

  it('holds no errors and an untouched state before the form is touched', () => {
    mountForm(
      { formDef: requiredFirstName, widgetLoaders: stubWidgetLoaders, data: {} },
      requiredValidators,
    );

    const templateData = lastAdapter<InputAdapter<string>>('firstName').templateData();
    expect(templateData.errors).toEqual([]);
    expect(templateData.touched).toBe(false);
  });

  it('holds the errors of a required empty input after a submit', () => {
    const { submit } = mountForm(
      { formDef: requiredFirstName, widgetLoaders: stubWidgetLoaders, data: {} },
      requiredValidators,
    );

    submit();

    const templateData = lastAdapter<InputAdapter<string>>('firstName').templateData();
    expect(templateData.errors).toEqual(['required']);
    expect(templateData.touched).toBe(true);
  });

  it('holds value, errors and touched inside templateData', () => {
    mountForm({
      formDef: rootLayout([{ ...firstNameInput, label: 'First name' }]),
      widgetLoaders: stubWidgetLoaders,
      data: { firstName: 'Ada' },
    });

    const adapter = lastAdapter<InputAdapter<string>>('firstName');
    expect(adapter.templateData()).toMatchObject({ value: 'Ada', errors: [], touched: false });
    expect(adapter.templateData()).not.toHaveProperty('isTouched');
    expect(adapter).not.toHaveProperty('value');
  });

  it('flattens the calculated widget and its props into templateData, with lang and deps', () => {
    const dependencies = { markdownParser: () => '' };
    mountForm({
      formDef: rootLayout([
        { ...firstNameInput, label: 'First name', props: { hint: 'Hello {{$form.firstName}}' } },
      ]),
      widgetLoaders: stubWidgetLoaders,
      data: { firstName: 'Ada' },
      dependencies,
      localization: identityTranslator('en-GB'),
    });

    const templateData = lastAdapter<InputAdapter<string>>('firstName').templateData();
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

  it('uses the value of a suffixed prop while its state is active', () => {
    const { setData } = mountForm({
      formDef: rootLayout(
        [{ ...firstNameInput, label: 'First name', 'label.adult': 'Legal name' }],
        { states: { adult: '$form.age >= 18' } },
      ),
      widgetLoaders: stubWidgetLoaders,
      data: { age: 20 },
    });
    const adapter = lastAdapter<InputAdapter>('firstName');

    expect(adapter.templateData().label).toBe('Legal name');

    setData({ age: 10 });

    expect(adapter.templateData().label).toBe('First name');
  });

  it('keeps the last visible templateData while hidden, and still updates the value', () => {
    const formDef = rootLayout([
      {
        ...firstNameInput,
        label: 'Name: {{$form.firstName}}',
        exclude: { when: '$form.hideFirstName === true' },
      },
    ]);
    const { setData } = mountWidgetsWithoutLayout(formDef, { firstName: 'Ada' }, ['firstName']);
    const adapter = lastAdapter<InputAdapter<string>>('firstName');
    expect(adapter.templateData().label).toBe('Name: Ada');

    setData({ firstName: 'Grace', hideFirstName: true });

    expect(adapter.templateData().value).toBe('Grace');
    expect(adapter.templateData().label).toBe('Name: Ada');
  });

  it('updates templateData.lang when the language changes', () => {
    const translator = identityTranslator('en-US');
    mountForm({
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: stubWidgetLoaders,
      data: {},
      localization: translator,
    });
    const adapter = lastAdapter<InputAdapter>('firstName');
    expect(adapter.templateData().lang).toBe('en-US');

    translator.setLang('es');

    expect(adapter.templateData().lang).toBe('es');
  });
});

describe('InputWidgetAdapter for a repeater', () => {
  it('lists one row node per data row, with the row index in the uid', () => {
    mountForm({
      formDef: rootLayout([usersRepeater()]),
      widgetLoaders: stubWidgetLoaders,
      data: { users: [{ name: 'Ada' }, { name: 'Linus' }] },
    });

    const templateData = lastAdapter<InputAdapter<unknown[]>>('users').templateData();
    expect(templateData.rows?.map((row) => row.uid)).toEqual(['userRow[0]', 'userRow[1]']);
  });

  it('keeps the last rows while the repeater is hidden', () => {
    const formDef = rootLayout([usersRepeater({ exclude: { when: '$form.hideUsers === true' } })]);
    const { setData } = mountWidgetsWithoutLayout(
      formDef,
      { users: [{ name: 'Ada' }, { name: 'Linus' }] },
      ['users'],
    );

    setData({ users: [{ name: 'Ada' }], hideUsers: true });

    const templateData = lastAdapter<InputAdapter<unknown[]>>('users').templateData();
    expect(templateData.value).toEqual([{ name: 'Ada' }]);
    expect(templateData.rows?.map((row) => row.uid)).toEqual(['userRow[0]', 'userRow[1]']);
  });
});

describe('LayoutWidgetAdapter', () => {
  it('lists the children of a repeater row with the row index in the uid and the path', () => {
    mountForm({
      formDef: rootLayout([usersRepeater()]),
      widgetLoaders: stubWidgetLoaders,
      data: { users: [{ name: 'Ada' }, { name: 'Linus' }] },
    });

    const secondRow = lastAdapter<LayoutAdapter>('userRow[1]');
    expect(secondRow.templateData().children).toEqual([
      expect.objectContaining({ uid: 'name[1]', path: 'users.1.name' }),
    ]);
    expect(lastAdapter<InputAdapter<string>>('name[1]').templateData().value).toBe('Linus');
  });

  it('removes a hidden child from children', () => {
    const { setData } = mountForm({
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
    expect(childUids(lastAdapter('root'))).toEqual(['firstName', 'nickname']);

    setData({ hideNickname: true });

    expect(childUids(lastAdapter('root'))).toEqual(['firstName']);
  });

  it('keeps the last children while the layout is hidden', () => {
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
    const { setData } = mountWidgetsWithoutLayout(formDef, {}, ['box']);
    expect(childUids(lastAdapter('box'))).toEqual(['firstName', 'nickname']);

    // A visible layout would drop the hidden nickname.
    setData({ hideBox: true, hideNickname: true });

    expect(childUids(lastAdapter('box'))).toEqual(['firstName', 'nickname']);
  });

  it('seeds templateData with the raw props and no children while the layout has never been visible', () => {
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
    const { setData } = mountWidgetsWithoutLayout(formDef, { gap: 'large', hideBox: true }, [
      'box',
    ]);
    const adapter = lastAdapter<LayoutAdapter>('box');
    expect(adapter.templateData()).toEqual({ children: [], gap: '{{$form.gap}}' });

    setData({ gap: 'large', hideBox: false });

    expect(adapter.templateData()).toMatchObject({ gap: 'large' });
    expect(childUids(adapter)).toEqual(['firstName']);
  });
});

describe('ActionWidgetAdapter', () => {
  it('sets templateData.invalid only after a submit of an invalid form', () => {
    const { submit } = mountForm(
      {
        formDef: rootLayout([
          { ...firstNameInput, validator: { required: true } },
          { uid: 'save', kind: 'action', type: 'button', actionType: 'submit', label: 'Save' },
        ]),
        widgetLoaders: stubWidgetLoaders,
        data: {},
      },
      requiredValidators,
    );
    const adapter = lastAdapter<ActionAdapter>('save');
    expect(adapter.templateData().invalid).toBe(false);

    submit();

    expect(adapter.templateData().invalid).toBe(true);
  });

  it('seeds templateData with the raw label only while the action has never been visible', () => {
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
    const { setData } = mountWidgetsWithoutLayout(formDef, { name: 'Ada', hideSave: true }, [
      'save',
    ]);
    const adapter = lastAdapter<ActionAdapter>('save');
    expect(adapter.templateData()).toEqual({ label: 'Save {{$form.name}}', invalid: false });

    setData({ name: 'Ada', hideSave: false });

    expect(adapter.templateData()).toMatchObject({
      label: 'Save Ada',
      icon: 'save',
      iconPosition: 'end',
    });
  });
});

describe('DisplayWidgetAdapter', () => {
  it('carries the calculated widget and its props in templateData', () => {
    mountForm({
      formDef: rootLayout([
        { uid: 'greeting', kind: 'display', type: 'text', props: { text: 'Hi {{$form.name}}' } },
      ]),
      widgetLoaders: stubWidgetLoaders,
      data: { name: 'Ada' },
    });

    expect(lastAdapter<DisplayAdapter>('greeting').templateData()).toMatchObject({
      uid: 'greeting',
      kind: 'display',
      type: 'text',
      text: 'Hi Ada',
    });
  });

  it('seeds templateData with the raw props while the widget has never been visible', () => {
    const formDef = rootLayout([
      {
        uid: 'greeting',
        kind: 'display',
        type: 'text',
        props: { text: 'Hi {{$form.name}}' },
        exclude: { when: '$form.hideGreeting === true' },
      },
    ]);
    const { setData } = mountWidgetsWithoutLayout(formDef, { name: 'Ada', hideGreeting: true }, [
      'greeting',
    ]);
    const adapter = lastAdapter<DisplayAdapter>('greeting');
    expect(adapter.templateData()).toEqual({ text: 'Hi {{$form.name}}' });

    setData({ name: 'Ada', hideGreeting: false });

    expect(adapter.templateData()).toMatchObject({ text: 'Hi Ada' });
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

  it('uses a random id as the form element id and the store formName when formName is not set', () => {
    const recorder = formNameRecorder();
    const { formElement } = mountForm({
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: stubWidgetLoaders,
      data: {},
      middlewares: [recorder.middleware],
    });

    expect(formElement().id).toMatch(/^[0-9a-f]{8}$/);
    expect(recorder.formNames.at(-1)).toBe(formElement().id);
  });

  it('uses formName as the form element id and as the store formName', () => {
    const recorder = formNameRecorder();
    const { formElement } = mountForm({
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: stubWidgetLoaders,
      data: {},
      formName: 'signup',
      middlewares: [recorder.middleware],
    });

    expect(formElement().id).toBe('signup');
    expect(recorder.formNames.at(-1)).toBe('signup');
  });

  it('gives two forms on one page different ids', () => {
    const twoFormsFixture = TestBed.createComponent(TwoFormsHostComponent);
    fixture = twoFormsFixture;
    twoFormsFixture.componentInstance.config.set({
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: stubWidgetLoaders,
      data: {},
    });
    twoFormsFixture.detectChanges();

    const ids = Array.from<HTMLFormElement>(
      twoFormsFixture.nativeElement.querySelectorAll('form'),
    ).map((form) => form.id);
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });
});

describe('a formDef changed on the same config object', () => {
  it('renders nothing new until a new config object arrives', () => {
    const config: StubConfig = {
      formDef: rootLayout([firstNameInput]),
      widgetLoaders: stubWidgetLoaders,
      data: {},
    };
    const mounted = mountForm(config);
    const renderedInputIds = () =>
      Array.from<HTMLInputElement>(mounted.fixture.nativeElement.querySelectorAll('input')).map(
        (input) => input.id,
      );
    expect(renderedInputIds()).toEqual(['firstName']);

    // The config input is a signal, and a signal ignores a set with the same object.
    config.formDef = rootLayout([
      { uid: 'email', kind: 'input', type: 'textinput', path: 'email' },
    ]);
    mounted.setConfig(config);

    expect(renderedInputIds()).toEqual(['firstName']);

    mounted.setConfig({ ...config });

    expect(renderedInputIds()).toEqual(['email']);
  });
});
