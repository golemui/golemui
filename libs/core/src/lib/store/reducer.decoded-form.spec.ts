import { type StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { type FormWidget } from '../form-widget';
import { identityTranslator } from '../i18n';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * What `INITIALIZE` decodes from a form definition, checked through the reducer: the keys and the
 * values of the decoded widgets, the objects that come from the definition, and the errors of a
 * definition that does not decode.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.decoded-form.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

/** No test of this file validates an input, so the validator accepts every value. */
const validators: ValidatorFn<unknown> = (): StandardSchemaV1 => ({
  '~standard': {
    version: 1,
    vendor: 'reducer-spec',
    validate: (value: unknown) => ({ value }),
  },
});

const reduce = reducer({
  validators,
  validateOn: 'eager',
  localization: identityTranslator('en-US'),
  functions: {},
});

/** Dispatches the actions from a new initial state and returns the last state. */
const drive = (actions: Action[]): State => actions.reduce(reduce, createInitialState('en-US'));

const initDocument = (formDef: Record<string, unknown>): Action => ({
  type: 'INITIALIZE',
  payload: { formName: 'test-form', formDef },
});

const init = (...widgets: Record<string, unknown>[]): Action => initDocument({ form: widgets });

const setData = (data: Record<string, any>): Action => ({
  type: 'SET_DATA',
  payload: { data },
});

const setFormHealthOk: Action = {
  type: 'SET_FORM_HEALTH',
  payload: { formHealth: { status: 'ok' } },
};

const display = (uid: string, extra: Record<string, unknown> = {}) => ({
  kind: 'display',
  uid,
  type: 'markdownText',
  props: {},
  ...extra,
});

const input = (uid: string | undefined, path: string, extra: Record<string, unknown> = {}) => ({
  kind: 'input',
  uid,
  type: 'textinput',
  path,
  ...extra,
});

/** The widget of `flatForm` as a plain record, so a test can read any key of it. */
const decodedWidget = (state: State, uid: string): Record<string, any> =>
  state.flatForm[uid] as unknown as Record<string, any>;

// `#0` is the root layout that holds the widgets of the form.
const ROOT_UID = '#0';

describe('reducer: the decoded form definition', () => {
  it('uses the decoded widgets of formDef as the widgets of flatForm', () => {
    const state = drive([init(display('title'))]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(state.flatForm[ROOT_UID]).toBe(state.formDef.form);
    expect(state.flatForm['title']).toBe(state.formDef.form.children[0]);
  });

  it.each<[string, Record<string, unknown>, Record<string, unknown>]>([
    [
      'display',
      { kind: 'display', uid: 'title', type: 'heading' },
      {
        kind: 'display',
        uid: 'title',
        type: 'heading',
        size: undefined,
        include: undefined,
        exclude: undefined,
        props: undefined,
      },
    ],
    [
      'action',
      { kind: 'action', uid: 'save', type: 'button' },
      {
        kind: 'action',
        uid: 'save',
        type: 'button',
        actionType: undefined,
        size: undefined,
        include: undefined,
        exclude: undefined,
        label: undefined,
        disabled: undefined,
        on: undefined,
        props: undefined,
      },
    ],
    [
      'input',
      { kind: 'input', uid: 'name', type: 'textinput', path: 'name' },
      {
        kind: 'input',
        uid: 'name',
        type: 'textinput',
        size: undefined,
        include: undefined,
        exclude: undefined,
        disabled: undefined,
        readonly: undefined,
        on: undefined,
        props: undefined,
        label: undefined,
        path: 'name',
        defaultValue: undefined,
        validator: undefined,
      },
    ],
    [
      'layout',
      { kind: 'layout', uid: 'section', type: 'flex', children: [] },
      {
        kind: 'layout',
        uid: 'section',
        type: 'flex',
        size: undefined,
        include: undefined,
        exclude: undefined,
        props: undefined,
        on: undefined,
        children: [],
      },
    ],
  ])(
    'decodes a widget of kind %s with every key of that kind, also the keys that are not set',
    (_kind, widget, decoded) => {
      const state = drive([init(widget)]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      // `toStrictEqual` fails when a key with the value undefined is missing.
      expect(decodedWidget(state, widget['uid'] as string)).toStrictEqual(decoded);
    },
  );

  it('keeps a state suffix on size and label, and drops a suffix on props and an unknown key', () => {
    const widget = {
      kind: 'input',
      uid: 'name',
      type: 'textinput',
      path: 'name',
      label: 'Name',
      'label.zoom': 'Zoomed name',
      'label.admin': 'Admin name',
      'size.zoom': 2,
      'props.zoom': { placeholder: 'dropped' },
      extra: 'dropped',
    };

    const state = drive([init(widget)]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(decodedWidget(state, 'name')).toStrictEqual({
      kind: 'input',
      uid: 'name',
      type: 'textinput',
      size: undefined,
      'size.zoom': 2,
      include: undefined,
      exclude: undefined,
      disabled: undefined,
      readonly: undefined,
      on: undefined,
      props: undefined,
      label: 'Name',
      'label.zoom': 'Zoomed name',
      'label.admin': 'Admin name',
      path: 'name',
      defaultValue: undefined,
      validator: undefined,
    });
  });
});

describe('reducer: objects that the decoded form takes from the definition', () => {
  it.each<[string, Record<string, unknown>]>([
    ['display', { kind: 'display', uid: 'w', type: 'heading' }],
    ['action', { kind: 'action', uid: 'w', type: 'button' }],
    ['input', { kind: 'input', uid: 'w', type: 'textinput', path: 'w' }],
    ['layout', { kind: 'layout', uid: 'w', type: 'flex', children: [] }],
  ])('keeps the props object of the definition in a widget of kind %s', (_kind, widget) => {
    const props = { text: 'Hello', style: { bold: true } };

    const state = drive([init({ ...widget, props })]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(decodedWidget(state, 'w')['props']).toBe(props);
  });

  it('keeps the other prop values of a repeater and the place of its template', () => {
    const header = { text: 'Users' };
    const footer = { text: 'End of the list' };
    const template = {
      kind: 'layout',
      uid: 'usersRow',
      type: 'flex',
      children: [input('name', 'users.items.name')],
    };

    const state = drive([
      init({
        kind: 'input',
        uid: 'users',
        type: 'repeater',
        path: 'users',
        props: { header, template, footer },
      }),
    ]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    const props = decodedWidget(state, 'users')['props'];
    expect(Object.keys(props)).toEqual(['header', 'template', 'footer']);
    expect(props['header']).toBe(header);
    expect(props['footer']).toBe(footer);
  });

  it('keeps the default value, the validator and the label params of the definition', () => {
    const defaultValue = { city: 'Paris' };
    const validator = { required: true };
    const params = { count: 2 };

    const state = drive([
      init(
        input('address', 'address', {
          label: { key: 'address.label', params },
          defaultValue,
          validator,
        }),
      ),
    ]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    const widget = decodedWidget(state, 'address');
    expect(widget['defaultValue']).toBe(defaultValue);
    expect(widget['validator']).toBe(validator);
    expect(widget['label'].params).toBe(params);
  });

  it('gives the on object of a widget all five event keys, in order', () => {
    const state = drive([
      init({ kind: 'action', uid: 'save', type: 'button', on: { click: 'saveClicked' } }),
    ]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(Object.entries(decodedWidget(state, 'save')['on'])).toEqual([
      ['load', undefined],
      ['click', 'saveClicked'],
      ['change', undefined],
      ['filter', undefined],
      ['blur', undefined],
    ]);
  });
});

describe('reducer: values that the decoder rejects or changes', () => {
  it.each<[string, Record<string, unknown>, string]>([
    [
      'size: null',
      display('title', { size: null }),
      '[22] form.children[0].size: null is not a valid number',
    ],
    [
      'label: null',
      input('name', 'name', { label: null }),
      '[22] form.children[0].label: no alternative matched (tried 2); form.children[0].label: null is not a valid string or null is not a valid object',
    ],
    [
      'children: null',
      { kind: 'layout', uid: 'section', type: 'flex', children: null },
      '[22] form.children[0].children: null is not a valid array',
    ],
    [
      'uid: 7',
      { kind: 'display', uid: 7, type: 'heading' },
      '[22] form.children[0].uid: 7 is not a valid string',
    ],
  ])('gives code 22 for a widget with %s', (_value, widget, message) => {
    const state = drive([init(widget)]);

    expect(state.formHealth).toEqual({ status: 'errored', code: 22, message });
    expect(state.flatForm).toEqual({});
  });

  it('decodes an include with both in and when as an include with in only', () => {
    const state = drive([
      initDocument({
        states: { admin: '$form.role === "admin"' },
        form: [display('title', { include: { in: ['admin'], when: '$form.show === true' } })],
      }),
    ]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    const include = decodedWidget(state, 'title')['include'];
    expect(Object.keys(include)).toEqual(['in']);
    expect(include).toEqual({ in: ['admin'] });
  });
});

describe('reducer: two widgets with one uid', () => {
  it.each<[string, Record<string, unknown>[], string]>([
    [
      'two display widgets',
      [display('title'), display('title')],
      '[21] Duplicate UID "title": Assigned to widget "markdownText" and "markdownText".',
    ],
    [
      'a display widget and an input',
      [display('name'), input('name', 'lastName')],
      '[21] Duplicate UID "name": Assigned to widget "markdownText" and "textinput" at "lastName".',
    ],
    [
      'two inputs with the same path and type and no uid',
      [input(undefined, 'email'), input(undefined, 'email')],
      '[21] Duplicate UID "email-textinput": Assigned to widget "textinput" at "email" and "textinput" at "email".',
    ],
  ])('reports code 21 for %s', (_widgets, form, message) => {
    const state = drive([init(...form)]);

    expect(state.formHealth).toEqual({ status: 'errored', code: 21, message });
  });

  it('keeps the decoded definition and builds no widget after code 21', () => {
    const state = drive([init(display('title'), display('title'))]);

    expect(state.formHealth).toEqual({
      status: 'errored',
      code: 21,
      message: '[21] Duplicate UID "title": Assigned to widget "markdownText" and "markdownText".',
    });
    expect(state.flatForm).toEqual({});
    expect(state.resolvedSources).toEqual({});
    expect(state.formDef.form.uid).toBe(ROOT_UID);
    expect(state.formDef.form.children.map((child: FormWidget<string>) => child.uid)).toEqual([
      'title',
      'title',
    ]);
    // The decoder adds every key of the kind, so these are the decoded widgets.
    expect(state.formDef.form.children[1]).toStrictEqual({
      kind: 'display',
      uid: 'title',
      type: 'markdownText',
      size: undefined,
      include: undefined,
      exclude: undefined,
      props: {},
    });
  });

  it('computes no widget after code 21 when the app sets the health to ok', () => {
    const errored = drive([
      init(
        input('name', 'firstName', { defaultValue: 'Ada' }),
        input('name', 'lastName', { defaultValue: 'Lovelace' }),
      ),
    ]);
    expect(errored.formHealth).toEqual({
      status: 'errored',
      code: 21,
      message:
        '[21] Duplicate UID "name": Assigned to widget "textinput" at "firstName" and "textinput" at "lastName".',
    });

    const cleared = reduce(errored, setFormHealthOk);
    const state = reduce(cleared, setData({ role: 'admin' }));

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(state.resolvedSources).toEqual({});
    expect(state.calculatedWidgets).toEqual({});
    // No input exists, so no default value is written.
    expect(Object.keys(state.data)).toEqual(['role']);
    expect(state.data).toEqual({ role: 'admin' });
  });
});
