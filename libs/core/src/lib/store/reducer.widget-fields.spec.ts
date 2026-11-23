import { type StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { type ActionWidget, type InputWidget, type LayoutWidget } from '../form-widget';
import { identityTranslator } from '../i18n';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * The keys and the core fields of a computed widget, checked through the reducer: each test sends
 * `INITIALIZE` and `SET_DATA`, and reads `calculatedWidgets[uid].current` of the state that
 * results.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.widget-fields.spec.ts
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

const init = (widgets: Record<string, unknown>[], states?: Record<string, string>): Action => ({
  type: 'INITIALIZE',
  payload: {
    formName: 'test-form',
    formDef: states ? { states, form: widgets } : { form: widgets },
  },
});

const setData = (data: Record<string, any>): Action => ({
  type: 'SET_DATA',
  payload: { data },
});

/** Sends `INITIALIZE` and `SET_DATA` and returns the state after the derive. */
const run = (
  widgets: Record<string, unknown>[],
  data: Record<string, any> = {},
  states?: Record<string, string>,
): State => drive([init(widgets, states), setData(data)]);

const currentOf = (state: State, uid: string): Record<string, unknown> =>
  state.calculatedWidgets[uid].current as unknown as Record<string, unknown>;

const repeater = (uid: string, path: string, children: unknown[]) => ({
  kind: 'input',
  uid,
  type: 'repeater',
  path,
  props: {
    template: {
      kind: 'layout',
      uid: `${uid}-template`,
      type: 'flex',
      children,
    },
  },
});

// One widget of each kind, with only the keys that the kind requires and a uid.
const displayWithRequiredKeys = { uid: 'title', kind: 'display', type: 'heading' };
const actionWithRequiredKeys = { uid: 'save', kind: 'action', type: 'button' };
const inputWithRequiredKeys = { uid: 'name', kind: 'input', type: 'textinput', path: 'name' };
const layoutWithRequiredKeys = { uid: 'box', kind: 'layout', type: 'flex', children: [] };

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('reducer: the keys of a computed widget', () => {
  it.each([
    ['display', displayWithRequiredKeys, ['uid', 'type', 'kind', 'size', 'include', 'exclude']],
    [
      'action',
      actionWithRequiredKeys,
      ['uid', 'type', 'kind', 'size', 'include', 'exclude', 'label', 'disabled', 'actionType'],
    ],
    [
      'input',
      inputWithRequiredKeys,
      [
        'uid',
        'type',
        'kind',
        'size',
        'include',
        'exclude',
        'label',
        'disabled',
        'readonly',
        'validator',
        'path',
        'defaultValue',
      ],
    ],
    [
      'layout',
      layoutWithRequiredKeys,
      ['uid', 'type', 'kind', 'size', 'include', 'exclude', 'children'],
    ],
  ])('lists the keys of a computed %s widget in a fixed order', (_kind, widget, expectedKeys) => {
    const next = run([widget]);

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(Object.keys(currentOf(next, widget.uid))).toEqual(expectedKeys);
  });

  it.each([
    [
      'display',
      displayWithRequiredKeys,
      {
        uid: 'title',
        type: 'heading',
        kind: 'display',
        size: undefined,
        include: undefined,
        exclude: undefined,
      },
    ],
    [
      'action',
      actionWithRequiredKeys,
      {
        uid: 'save',
        type: 'button',
        kind: 'action',
        size: undefined,
        include: undefined,
        exclude: undefined,
        label: undefined,
        disabled: undefined,
        actionType: undefined,
      },
    ],
    [
      'input',
      inputWithRequiredKeys,
      {
        uid: 'name',
        type: 'textinput',
        kind: 'input',
        size: undefined,
        include: undefined,
        exclude: undefined,
        label: undefined,
        disabled: undefined,
        readonly: undefined,
        validator: undefined,
        path: 'name',
        defaultValue: undefined,
      },
    ],
    [
      'layout',
      layoutWithRequiredKeys,
      {
        uid: 'box',
        type: 'flex',
        kind: 'layout',
        size: undefined,
        include: undefined,
        exclude: undefined,
        children: [],
      },
    ],
  ])(
    'gives a computed %s widget every core field of its kind, also a field that is not set',
    (_kind, widget, expected) => {
      const next = run([widget]);

      expect(next.formHealth).toEqual({ status: 'ok' });
      // `toStrictEqual` fails when a key with the value undefined is missing.
      expect(currentOf(next, widget.uid)).toStrictEqual(expected);
    },
  );

  it('places props and on after the core fields, and children last', () => {
    const next = run([
      {
        uid: 'box',
        kind: 'layout',
        type: 'flex',
        children: [],
        props: { gap: 2 },
        size: 6,
      },
      {
        uid: 'name',
        kind: 'input',
        type: 'textinput',
        on: { change: 'nameChanged' },
        props: { placeholder: 'Name' },
        path: 'name',
        label: 'Name',
      },
    ]);

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(Object.keys(currentOf(next, 'box'))).toEqual([
      'uid',
      'type',
      'kind',
      'size',
      'include',
      'exclude',
      'props',
      'children',
    ]);
    expect(Object.keys(currentOf(next, 'name'))).toEqual([
      'uid',
      'type',
      'kind',
      'size',
      'include',
      'exclude',
      'label',
      'disabled',
      'readonly',
      'validator',
      'path',
      'defaultValue',
      'props',
      'on',
    ]);
  });

  it('copies include and exclude into a computed action and layout, and actionType into an action', () => {
    const next = run(
      [
        {
          uid: 'save',
          kind: 'action',
          type: 'button',
          include: { when: '$form.show' },
          exclude: { when: '$form.hide' },
          actionType: 'submit',
        },
        {
          uid: 'box',
          kind: 'layout',
          type: 'flex',
          include: { when: '$form.show' },
          exclude: { when: '$form.hide' },
          children: [],
        },
      ],
      { show: true, hide: false },
    );

    const action = next.calculatedWidgets['save'].current as ActionWidget<string>;
    const layout = next.calculatedWidgets['box'].current as LayoutWidget<string>;
    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(action.include).toEqual({ when: '$form.show' });
    expect(action.exclude).toEqual({ when: '$form.hide' });
    expect(action.actionType).toBe('submit');
    expect(layout.include).toEqual({ when: '$form.show' });
    expect(layout.exclude).toEqual({ when: '$form.hide' });
  });

  it('gives current.on the five event names in a fixed order, also an event that is not set', () => {
    const next = run(
      [
        {
          uid: 'save',
          kind: 'action',
          type: 'button',
          on: { click: 'saved', 'change.s': 'changedInS' },
        },
      ],
      {},
      { s: 'true' },
    );

    const on = (next.calculatedWidgets['save'].current as ActionWidget<string>).on;
    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(Object.keys(on ?? {})).toEqual(['load', 'click', 'change', 'filter', 'blur']);
    // The suffixed key gives the value of `change`, and is not a key of its own.
    expect(on).toStrictEqual({
      load: undefined,
      click: 'saved',
      change: 'changedInS',
      filter: undefined,
      blur: undefined,
    });
  });
});

describe('reducer: the core fields of a computed widget', () => {
  it('reports the decode error code 22 for a size that is a template', () => {
    const next = run([{ uid: 'title', kind: 'display', type: 'heading', size: '{{ 1 }}' }]);

    expect(next.formHealth).toEqual({
      status: 'errored',
      code: 22,
      message: '[22] form.children[0].size: "{{ 1 }}" is not a valid number',
    });
    expect(next.calculatedWidgets).toEqual({});
  });

  it('gives current.include and current.exclude as the objects of the decoded widget', () => {
    const next = run(
      [
        {
          uid: 'title',
          kind: 'display',
          type: 'heading',
          include: { when: '$form.show' },
          exclude: { when: '$form.hide' },
        },
      ],
      { show: true, hide: false },
    );

    const current = currentOf(next, 'title');
    const decoded = next.flatForm['title'] as unknown as Record<string, unknown>;
    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(current['include']).toBe(decoded['include']);
    expect(current['exclude']).toBe(decoded['exclude']);
  });

  it('gives current.defaultValue as the object of the form definition', () => {
    const defaultValue = { street: 'Main' };

    const next = run([
      { uid: 'address', kind: 'input', type: 'address', path: 'address', defaultValue },
    ]);

    const current = next.calculatedWidgets['address'].current as InputWidget<any, string>;
    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(current.defaultValue).toBe(defaultValue);
  });

  describe('a state suffix on disabled and readonly', () => {
    /** An input whose `field` has the base value and the value for the active state `s`. */
    const runWithSuffix = (
      field: 'disabled' | 'readonly',
      base: unknown,
      suffixed: unknown,
      data: Record<string, any>,
    ): State =>
      run(
        [
          {
            uid: 'name',
            kind: 'input',
            type: 'textinput',
            path: 'name',
            [field]: base,
            [`${field}.s`]: suffixed,
          },
        ],
        data,
        { s: 'true' },
      );

    it.each<['disabled' | 'readonly', string, Record<string, boolean>, boolean]>([
      ['disabled', 'true and the suffixed one is false', { a: true, b: false }, true],
      ['disabled', 'false and the suffixed one is true', { a: false, b: true }, false],
      ['readonly', 'true and the suffixed one is false', { a: true, b: false }, true],
    ])(
      'gives %s the result of the base condition when it is %s',
      (field, _description, data, expected) => {
        const next = runWithSuffix(field, { when: '$form.a' }, { when: '$form.b' }, data);

        expect(next.formHealth).toEqual({ status: 'ok' });
        expect(next.currentStates).toEqual(['s']);
        expect(currentOf(next, 'name')[field]).toBe(expected);
        expect(next.widgetFlags['name']).toEqual({ [field]: expected });
      },
    );

    it('gives disabled undefined for a suffixed condition when the base value is not a condition', () => {
      const next = runWithSuffix('disabled', false, { when: '$form.b' }, { b: true });

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(next.currentStates).toEqual(['s']);
      expect(currentOf(next, 'name')).toHaveProperty('disabled', undefined);
      expect(next.widgetFlags).not.toHaveProperty('name');
    });

    it('gives disabled a suffixed false while the flag of the base condition is true', () => {
      const next = runWithSuffix('disabled', { when: 'true' }, false, {});

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(next.currentStates).toEqual(['s']);
      expect(currentOf(next, 'name')['disabled']).toBe(false);
      expect(next.widgetFlags['name']).toEqual({ disabled: true });
    });
  });

  it('gives false for a disabled and a readonly condition that is false', () => {
    const next = run(
      [
        {
          uid: 'name',
          kind: 'input',
          type: 'textinput',
          path: 'name',
          disabled: { when: '$form.locked' },
          readonly: { when: '$form.locked' },
        },
      ],
      { locked: false },
    );

    const current = next.calculatedWidgets['name'].current as InputWidget<any, string>;
    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(current.disabled).toBe(false);
    expect(current.readonly).toBe(false);
  });

  it('gives a row widget an entry whose source has the content of its resolved source', () => {
    const first = drive([
      init([
        repeater('users', 'users', [
          { uid: 'name', kind: 'input', type: 'textinput', path: 'users.items.name' },
        ]),
      ]),
      setData({ users: [{}] }),
    ]);
    // The second derive keeps the entry of the first row and adds an entry for the second row.
    const second = reduce(first, setData({ users: [{}, {}] }));

    expect(second.formHealth).toEqual({ status: 'ok' });
    // `toStrictEqual` fails when a key with the value undefined is missing.
    expect(second.calculatedWidgets['name[0]'].source).toStrictEqual(
      second.resolvedSources['name[0]'],
    );
    expect(second.calculatedWidgets['name[1]'].source).toStrictEqual(
      second.resolvedSources['name[1]'],
    );
  });
});
