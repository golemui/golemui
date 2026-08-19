import { type StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it, vi } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import {
  type ActionWidget,
  type DisplayWidget,
  type FormWidget,
  type FunctionWidget,
  type InputWidget,
  type LayoutWidget,
  type NonFunctionWidget,
} from '../form-widget';
import { identityTranslator } from '../i18n';
import { type ExpressionFunctions, type ValidateOn } from '../shared';
import { pruneHiddenData } from '../utils/form';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * End-to-end reducer spec. Unlike the per-reducer specs, which place widgets into
 * `state.calculatedWidgets` by hand, this drives the REAL reducer through realistic action
 * sequences and asserts the resulting state.
 *
 * The store computes the whole widget set from the data on every input-changing action (one
 * derive), so nothing here mounts a component: `calculatedWidgets` holds every visible widget as
 * soon as `SET_DATA` runs.
 *
 * `REFACTOR-NOTE` marks a mechanic that disappears when the no-op mount actions (`ADD_WIDGET`,
 * `REMOVE_WIDGET`, `SET_WIDGET_INITIAL_DATA`) and the blur-time function-widget re-resolve are
 * removed. Everything else is a plain assertion: behavior that must survive.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

/**
 * Minimal validator descriptor understood by the `validators` factory below.
 * Only `required` is supported, which is enough to make validation observable.
 */
type TestValidator = { required?: boolean };

/**
 * Turns a `TestValidator` descriptor into a Standard Schema, the same contract the real
 * `@golemui/gui-validators` package fulfils.
 */
const validators: ValidatorFn<TestValidator> = (validator): StandardSchemaV1 => ({
  '~standard': {
    version: 1,
    vendor: 'reducer-spec',
    validate: (value: unknown) => {
      const isEmpty = value === undefined || value === null || value === '';
      if (validator?.required && isEmpty) {
        return { issues: [{ message: 'required' }] };
      }
      return { value };
    },
  },
});

/** Host functions exposed to expressions under the `$fn` namespace. */
const functions: ExpressionFunctions = {
  double: (n: number) => n * 2,
  isAdult: (age: number) => age >= 18,
};

const makeReducer = (validateOn: ValidateOn = 'eager') =>
  reducer({
    validators: validators as ValidatorFn<any>,
    validateOn,
    localization: identityTranslator('en-US'),
    functions,
  });

/** Dispatches a sequence of actions from a fresh initial state and returns the final state. */
const drive = (actions: Action[], validateOn: ValidateOn = 'eager'): State => {
  const reduce = makeReducer(validateOn);
  return actions.reduce((state, action) => reduce(state, action), createInitialState('en-US'));
};

const init = (formDef: Record<string, any>): Action => ({
  type: 'INITIALIZE',
  payload: { formName: 'test-form', formDef },
});

const setData = (data: Record<string, any>): Action => ({
  type: 'SET_DATA',
  payload: { data },
});

const setWidgetData = (path: string, data: unknown): Action => ({
  type: 'SET_WIDGET_DATA',
  payload: { path, data },
});

const blur = (path: string, uid: string): Action => ({
  type: 'ATTEMPT_VALIDATION',
  payload: { reason: 'blur', path, uid },
});

const validateAllAction: Action = { type: 'VALIDATE_ALL' };

const addWidget = (widget: FormWidget<string>): Action => ({
  type: 'ADD_WIDGET',
  payload: { widget },
});

const propsOf = (state: State, uid: string): Record<string, any> =>
  (state.calculatedWidgets[uid].current as NonFunctionWidget<string>).props ?? {};

/** The uids a layout reports as its children, in order. */
const childUidsOf = (state: State, uid: string): (string | undefined)[] =>
  (state.calculatedWidgets[uid].current as LayoutWidget<string>).children.map(
    (child) => child.uid as string | undefined,
  );

// -----------------------------------------------------------------------------
// Fixtures
//
// Each fixture is a factory: `initialize` rewrites a `form` array in place, so a shared object
// would be mutated by the first INITIALIZE and reused in a different shape by the next test.
// -----------------------------------------------------------------------------

/**
 * A representative JSON form: a validated plain input, a state-gated display widget, and a
 * repeater whose template holds one input. Authored as plain JSON (no builder), so it exercises
 * the decoder's uid/path handling.
 */
const makeBaseFormDef = () => ({
  states: { adult: '$form.age >= 18' },
  form: [
    {
      uid: 'firstName',
      kind: 'input',
      type: 'textinput',
      path: 'firstName',
      validator: { required: true },
    },
    { uid: 'bio', kind: 'display', type: 'heading', include: { in: ['adult'] } },
    {
      uid: 'users',
      kind: 'input',
      type: 'repeater',
      path: 'users',
      props: {
        template: {
          uid: 'usersRow',
          kind: 'layout',
          type: 'flex',
          children: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'users.items.name' }],
        },
      },
    },
  ],
});

/**
 * Inputs with and without defaults, one of them hidden, one on a nested path, plus a repeater
 * whose own default creates a row whose input has a default of its own.
 */
const makeDefaultsFormDef = () => ({
  states: { adult: '$form.age >= 18' },
  form: [
    {
      uid: 'firstName',
      kind: 'input',
      type: 'textinput',
      path: 'firstName',
      defaultValue: 'Anon',
    },
    { uid: 'street', kind: 'input', type: 'textinput', path: 'address.street' },
    {
      uid: 'secret',
      kind: 'input',
      type: 'textinput',
      path: 'secret',
      defaultValue: 'shh',
      include: { in: ['adult'] },
    },
    {
      uid: 'users',
      kind: 'input',
      type: 'repeater',
      path: 'users',
      defaultValue: [{}],
      props: {
        template: {
          uid: 'usersRow',
          kind: 'layout',
          type: 'flex',
          children: [
            {
              uid: 'name',
              kind: 'input',
              type: 'textinput',
              path: 'users.items.name',
              defaultValue: 'New user',
            },
          ],
        },
      },
    },
  ],
});

/**
 * A repeater whose template children read the row through `$item` / `$index`, plus one child that
 * still uses the legacy `.items.` token in its `when` expression.
 */
const makeRowScopeFormDef = () => ({
  form: [
    {
      uid: 'lineItems',
      kind: 'input',
      type: 'repeater',
      path: 'lineItems',
      props: {
        template: {
          uid: 'lineItemsRow',
          kind: 'layout',
          type: 'flex',
          children: [
            {
              uid: 'quantity',
              kind: 'input',
              type: 'numberinput',
              path: 'lineItems.items.quantity',
              include: { when: '$item.active === true' },
            },
            {
              uid: 'firstRowBadge',
              kind: 'display',
              type: 'heading',
              include: { when: '$index === 0' },
            },
            {
              uid: 'rowTotal',
              kind: 'display',
              type: 'heading',
              props: { text: 'Row {{$index + 1}}: {{$item.quantity}}' },
            },
            {
              uid: 'legacyGate',
              kind: 'display',
              type: 'heading',
              include: { when: '$form.lineItems.items.active === true' },
            },
          ],
        },
      },
    },
  ],
});

/** Two `lineItems` rows: the first one active, the second one not. */
const rowScopeData = {
  lineItems: [
    { quantity: 2, active: true },
    { quantity: 5, active: false },
  ],
};

/**
 * A form that reads host functions through `$fn` from all three expression contexts:
 * a declared state, a widget flag `when`, and a `{{ }}` interpolation.
 */
const makeHostFunctionsFormDef = () => ({
  states: { adult: '$fn.isAdult($form.age)' },
  form: [
    {
      uid: 'adultsOnly',
      kind: 'display',
      type: 'heading',
      include: { when: '$fn.isAdult($form.age)' },
    },
    {
      uid: 'doubled',
      kind: 'display',
      type: 'heading',
      props: { text: 'Double: {{$fn.double($form.count)}}' },
    },
  ],
});

/**
 * A function widget living inside a repeater template. It echoes everything the engine hands it
 * back through `props`, so a test can assert what was in scope when it ran.
 */
const makeRowNameFunctionWidget = (): FunctionWidget<string> => {
  const rowName: FunctionWidget<string> = (api) =>
    ({
      uid: 'rowName',
      kind: 'input',
      type: 'textinput',
      path: 'users.items.name',
      validator: { required: true },
      props: {
        seenItemName: api?.$item?.name,
        seenIndex: api?.$index,
        seenErrors: api?.errors,
        seenTouched: api?.touched,
        seenTranslate: typeof api?.translate,
      },
    }) as InputWidget<any, string>;
  rowName.uid = 'rowName';
  return rowName;
};

const makeRowFunctionFormDef = () => ({
  form: [
    {
      uid: 'users',
      kind: 'input',
      type: 'repeater',
      path: 'users',
      props: {
        template: {
          uid: 'usersRow',
          kind: 'layout',
          type: 'flex',
          children: [makeRowNameFunctionWidget()],
        },
      },
    },
  ],
});

/** A repeater whose row input is required. */
const makeRequiredRowsFormDef = () => ({
  form: [
    {
      uid: 'users',
      kind: 'input',
      type: 'repeater',
      path: 'users',
      props: {
        template: {
          uid: 'usersRow',
          kind: 'layout',
          type: 'flex',
          children: [
            {
              uid: 'name',
              kind: 'input',
              type: 'textinput',
              path: 'users.items.name',
              validator: { required: true },
            },
          ],
        },
      },
    },
  ],
});

/**
 * The same widgets as `makeBaseFormDef` minus the repeater, wrapped in a layout, so a test can
 * watch what a parent layout reports as its visible children.
 */
const makeLayoutFormDef = () => ({
  states: { adult: '$form.age >= 18' },
  form: [
    {
      uid: 'card',
      kind: 'layout',
      type: 'flex',
      children: [
        {
          uid: 'firstName',
          kind: 'input',
          type: 'textinput',
          path: 'firstName',
          validator: { required: true },
        },
        { uid: 'bio', kind: 'display', type: 'heading', include: { in: ['adult'] } },
      ],
    },
  ],
});

/** A required input that is only shown in the `adult` state. */
const makeGatedInputFormDef = () => ({
  states: { adult: '$form.age >= 18' },
  form: [
    {
      uid: 'secret',
      kind: 'input',
      type: 'textinput',
      path: 'secret',
      validator: { required: true },
      include: { in: ['adult'] },
    },
  ],
});

/**
 * The same gated required input plus an always-visible sibling, so a test can blur another
 * input before the gated one is revealed.
 */
const makeGatedInputWithSiblingFormDef = () => ({
  states: { adult: '$form.age >= 18' },
  form: [
    { uid: 'nickname', kind: 'input', type: 'textinput', path: 'nickname' },
    {
      uid: 'secret',
      kind: 'input',
      type: 'textinput',
      path: 'secret',
      validator: { required: true },
      include: { in: ['adult'] },
    },
  ],
});

/**
 * A form whose state, flags and props all read the validation variables: `$errors` for one
 * widget's `when`, `$formIsInvalid` for a state and for a button's `disabled`.
 */
const makeValidationDrivenFormDef = () => ({
  states: { broken: '$formIsInvalid' },
  form: [
    {
      uid: 'firstName',
      kind: 'input',
      type: 'textinput',
      path: 'firstName',
      validator: { required: true },
    },
    { uid: 'nameHint', kind: 'display', type: 'heading', include: { when: '!!$errors.firstName' } },
    {
      uid: 'submit',
      kind: 'action',
      type: 'button',
      actionType: 'submit',
      disabled: { when: '$formIsInvalid' },
    },
  ],
});

/** A required input that only appears once the form is invalid, next to a required input. */
const makeSubmitRevealFormDef = () => ({
  form: [
    {
      uid: 'firstName',
      kind: 'input',
      type: 'textinput',
      path: 'firstName',
      validator: { required: true },
    },
    {
      uid: 'afterSubmitOnly',
      kind: 'input',
      type: 'textinput',
      path: 'afterSubmitOnly',
      validator: { required: true },
      include: { when: '$formIsInvalid' },
    },
  ],
});

/**
 * An interpolation that reads through a missing object. It throws while resolving props, which is
 * how a test drives the form into an errored `formHealth`.
 */
const makeBrokenInterpolationFormDef = () => ({
  states: { adult: '$form.age >= 18' },
  form: [
    { uid: 'oops', kind: 'display', type: 'heading', props: { text: 'Hi {{$form.missing.deep}}' } },
    { uid: 'fine', kind: 'display', type: 'heading', props: { text: 'plain' } },
  ],
});

/** A `when` condition that reads through a missing object, so the flags pass throws. */
const makeBrokenWhenFormDef = () => ({
  form: [
    {
      uid: 'gate',
      kind: 'display',
      type: 'heading',
      include: { when: '$form.missing.deep === 1' },
    },
    { uid: 'fine', kind: 'display', type: 'heading', props: { text: 'plain' } },
  ],
});

/** A form driven entirely by `$meta`: one state, one flag and one interpolated prop. */
const makeMetaFormDef = () => ({
  states: { debug: '$meta.debug === true' },
  form: [
    { uid: 'banner', kind: 'display', type: 'heading', props: { text: 'Mode {{$meta.mode}}' } },
    { uid: 'debugOnly', kind: 'display', type: 'heading', include: { in: ['debug'] } },
  ],
});

/** A repeater inside a repeater template, so `$item` / `$index` resolve at two levels. */
const makeNestedRepeaterFormDef = () => ({
  form: [
    {
      uid: 'teams',
      kind: 'input',
      type: 'repeater',
      path: 'teams',
      props: {
        template: {
          uid: 'teamRow',
          kind: 'layout',
          type: 'flex',
          children: [
            {
              uid: 'devs',
              kind: 'input',
              type: 'repeater',
              path: 'teams.items.devs',
              props: {
                template: {
                  uid: 'devRow',
                  kind: 'layout',
                  type: 'flex',
                  children: [
                    {
                      uid: 'devName',
                      kind: 'input',
                      type: 'textinput',
                      path: 'teams.items.devs.items.name',
                      include: { when: '$item.active === true' },
                    },
                    {
                      uid: 'devLabel',
                      kind: 'display',
                      type: 'heading',
                      props: { text: 'dev {{$index}}: {{$item.name}}' },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    },
  ],
});

/** Two teams, the first one with two devs (only the first active), the second one with one dev. */
const nestedRepeaterData = {
  teams: [
    {
      devs: [
        { name: 'Ada', active: true },
        { name: 'Linus', active: false },
      ],
    },
    { devs: [{ name: 'Grace', active: true }] },
  ],
};

/**
 * The same two levels as `makeNestedRepeaterFormDef`, with an `include.when` on both the outer
 * repeater and the nested one, so a test can compare how each container is flagged.
 */
const makeGatedNestedRepeaterFormDef = () => ({
  form: [
    {
      uid: 'teams',
      kind: 'input',
      type: 'repeater',
      path: 'teams',
      include: { when: '$form.showTeams === true' },
      props: {
        template: {
          uid: 'teamRow',
          kind: 'layout',
          type: 'flex',
          children: [
            {
              uid: 'devs',
              kind: 'input',
              type: 'repeater',
              path: 'teams.items.devs',
              include: { when: '$item.showDevs === true' },
              props: {
                template: {
                  uid: 'devRow',
                  kind: 'layout',
                  type: 'flex',
                  children: [
                    {
                      uid: 'devName',
                      kind: 'input',
                      type: 'textinput',
                      path: 'teams.items.devs.items.name',
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    },
  ],
});

/**
 * A form authored without uids, so every non-input widget gets a deterministic position uid
 * (`#0.1.t.0` style) from `assignDeterministicUids`.
 */
const makePositionUidFormDef = () => ({
  form: [
    { kind: 'display', type: 'heading' },
    {
      kind: 'input',
      type: 'repeater',
      path: 'rows',
      props: {
        template: {
          kind: 'layout',
          type: 'flex',
          children: [
            { kind: 'display', type: 'heading', props: { text: 'Row {{$index}}' } },
            { kind: 'display', type: 'heading', include: { when: '$index === 0' } },
          ],
        },
      },
    },
  ],
});

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('reducer end-to-end', () => {
  // ---------------------------------------------------------------------------
  // 1. Data-driven widget set
  // ---------------------------------------------------------------------------

  describe('data-driven widget set', () => {
    it('INITIALIZE decodes the form and builds flatForm without computing any widget', () => {
      const state = drive([init(makeBaseFormDef())]);

      expect(state.formHealth.status).toBe('ok');
      expect(state.formName).toBe('test-form');

      expect(state.flatForm).toHaveProperty('firstName');
      expect(state.flatForm).toHaveProperty('bio');
      expect(state.flatForm).toHaveProperty('users');

      // Repeater template descendants are NOT flattened into flatForm; only the repeater widget
      // itself is present (the template lives on its props).
      expect(state.flatForm).not.toHaveProperty('usersRow');
      expect(state.flatForm).not.toHaveProperty('name');

      // Without data there are no rows, so `resolvedSources` holds exactly the flatForm widgets.
      expect(Object.keys(state.resolvedSources).sort()).toEqual(Object.keys(state.flatForm).sort());
      expect(state.resolvedSources['users']).toBe(state.flatForm['users']);
      expect(state.repeaterItemScopes).toEqual({});

      // The first derive runs on the SET_DATA every binding dispatches next, so an interpolation
      // that reads through data which is not there yet cannot error the form here.
      expect(state.calculatedWidgets).toEqual({});
      expect(state.currentStates).toEqual([]);
      expect(state.widgetFlags).toEqual({});
      expect(state.validations).toEqual({});
      expect(state.data).toEqual({});
    });

    it('SET_DATA computes states, flags, repeater rows and every visible widget', () => {
      const state = drive([
        init(makeBaseFormDef()),
        setData({ firstName: 'Joan', users: [{}, {}] }),
      ]);

      expect(state.formHealth.status).toBe('ok');
      expect(state.data).toEqual({ firstName: 'Joan', users: [{}, {}] });

      // `age` is undefined, so the `adult` state is inactive and the gated display is hidden.
      expect(state.currentStates).toEqual([]);
      expect(state.widgetFlags['bio']).toEqual({ hidden: true });

      // Every repeater row is expanded from the array data next to the static widgets. The
      // template's own layout widget is expanded per row as well.
      expect(Object.keys(state.resolvedSources).sort()).toEqual(
        [...Object.keys(state.flatForm), 'name[0]', 'name[1]', 'usersRow[0]', 'usersRow[1]'].sort(),
      );
      expect((state.resolvedSources['name[1]'] as InputWidget<any, string>).path).toBe(
        'users.1.name',
      );
      expect(state.repeaterItemScopes['name[0]']).toEqual({ itemPath: 'users.0', index: 0 });
      expect(state.repeaterItemScopes['name[1]']).toEqual({ itemPath: 'users.1', index: 1 });

      // The flags map only holds widgets that actually declare a reactive flag. Row leaves
      // without one get no entry at all (no empty `{}` placeholders).
      expect(state.widgetFlags).not.toHaveProperty('name[0]');
      expect(state.widgetFlags).not.toHaveProperty('name[1]');

      // Every visible widget is computed, rows and row layout nodes included, without any
      // component having mounted. The root layout is `#0`. The hidden `bio` has no entry.
      expect(Object.keys(state.calculatedWidgets).sort()).toEqual(
        ['#0', 'firstName', 'users', 'usersRow[0]', 'usersRow[1]', 'name[0]', 'name[1]'].sort(),
      );
      const firstName = state.calculatedWidgets['firstName'].current as InputWidget<any, string>;
      expect(firstName.uid).toBe('firstName');
      expect(firstName.kind).toBe('input');
      expect(firstName.type).toBe('textinput');
      expect(firstName.path).toBe('firstName');
      const rowName = state.calculatedWidgets['name[1]'].current as InputWidget<any, string>;
      expect(rowName.uid).toBe('name[1]');
      expect(rowName.path).toBe('users.1.name');
      expect(state.calculatedWidgets['usersRow[1]'].current.uid).toBe('usersRow[1]');
    });

    it('activates a declared state when its expression becomes true', () => {
      const state = drive([init(makeBaseFormDef()), setData({ age: 21, users: [{}] })]);

      expect(state.currentStates).toEqual(['adult']);
      expect(state.widgetFlags['bio']).toEqual({ hidden: false });
    });

    it('SET_DATA resolves a row function widget with the row and the store in scope', () => {
      const state = drive([
        init(makeRowFunctionFormDef()),
        setData({ users: [{ name: 'Ada' }, { name: 'Linus' }] }),
      ]);

      const current = state.calculatedWidgets['rowName[1]'].current as InputWidget<any, string>;
      expect(current.uid).toBe('rowName[1]');
      // The function returns the template path, the derive stamps the row path on.
      expect(current.path).toBe('users.1.name');
      expect(current.props?.['seenItemName']).toBe('Linus');
      expect(current.props?.['seenIndex']).toBe(1);
      expect(current.props?.['seenErrors']).toBeUndefined();
      expect(current.props?.['seenTouched']).toBeUndefined();
      expect(current.props?.['seenTranslate']).toBe('function');
    });

    // REFACTOR-NOTE: the three mount actions are no-ops and go away with their dispatch sites.
    it('ADD_WIDGET, REMOVE_WIDGET and SET_WIDGET_INITIAL_DATA return the same state object', () => {
      const state = drive([init(makeBaseFormDef()), setData({ firstName: 'Joan' })]);
      const reduce = makeReducer();

      expect(reduce(state, addWidget(state.flatForm['bio']))).toBe(state);
      expect(reduce(state, { type: 'REMOVE_WIDGET', payload: { uid: 'firstName' } })).toBe(state);
      expect(
        reduce(state, {
          type: 'SET_WIDGET_INITIAL_DATA',
          payload: { path: 'firstName', data: 'default' },
        }),
      ).toBe(state);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Default values
  // ---------------------------------------------------------------------------

  describe('default values', () => {
    it('writes every missing default on SET_DATA, hidden inputs and repeater rows included', () => {
      const state = drive([init(makeDefaultsFormDef()), setData({})]);

      expect(state.data['firstName']).toBe('Anon');
      // An input without a default still gets its path created, so expressions can read through it.
      expect('street' in state.data['address']).toBe(true);
      expect(state.data['address']['street']).toBeUndefined();
      // The hidden input's default lands in the data too.
      expect(state.widgetFlags['secret']).toEqual({ hidden: true });
      expect(state.data['secret']).toBe('shh');
      // The repeater default creates a row, and the row input's default lands in that row.
      expect(state.data['users']).toEqual([{ name: 'New user' }]);
      expect(state.calculatedWidgets).toHaveProperty('name[0]');

      // A hidden input's default is stripped from the submit payload.
      expect(pruneHiddenData(state)).not.toHaveProperty('secret');
    });

    it('does not re-default a cleared value', () => {
      const cleared = drive([
        init(makeDefaultsFormDef()),
        setData({ firstName: '', secret: null, users: [], address: { street: undefined } }),
      ]);

      expect(cleared.data['firstName']).toBe('');
      expect(cleared.data['secret']).toBeNull();
      expect(cleared.data['users']).toEqual([]);
      expect('street' in cleared.data['address']).toBe(true);

      const explicitUndefined = drive([
        init(makeDefaultsFormDef()),
        setData({ firstName: undefined }),
      ]);
      expect('firstName' in explicitUndefined.data).toBe(true);
      expect(explicitUndefined.data['firstName']).toBeUndefined();

      const clearedByEdit = drive([
        init(makeDefaultsFormDef()),
        setData({}),
        setWidgetData('firstName', ''),
      ]);
      expect(clearedByEdit.data['firstName']).toBe('');
    });

    it('leaves an existing value alone', () => {
      const state = drive([init(makeDefaultsFormDef()), setData({ firstName: 'Joan' })]);

      expect(state.data['firstName']).toBe('Joan');
    });

    it('never marks a defaulted input touched or validated', () => {
      const state = drive([init(makeDefaultsFormDef()), setData({})]);

      expect(state.touched).toBe(false);
      expect(state.touchedControls).toEqual({});
      expect(state.validations).toEqual({});
    });
  });

  // ---------------------------------------------------------------------------
  // 3. $item / $index inside repeater rows
  // ---------------------------------------------------------------------------

  describe('$item and $index inside repeater rows', () => {
    it('computes per-row flags from an $item expression', () => {
      const state = drive([init(makeRowScopeFormDef()), setData(rowScopeData)]);

      expect(state.widgetFlags['quantity[0]']).toEqual({ hidden: false });
      expect(state.widgetFlags['quantity[1]']).toEqual({ hidden: true });
    });

    it('computes per-row flags from an $index expression', () => {
      const state = drive([init(makeRowScopeFormDef()), setData(rowScopeData)]);

      expect(state.widgetFlags['firstRowBadge[0]']).toEqual({ hidden: false });
      expect(state.widgetFlags['firstRowBadge[1]']).toEqual({ hidden: true });
    });

    it('indexes uid and path per row and keeps a row function widget callable with $item / $index', () => {
      const state = drive([
        init(makeRowFunctionFormDef()),
        setData({ users: [{ name: 'Ada' }, { name: 'Linus' }] }),
      ]);

      const firstRow = state.resolvedSources['rowName[0]'] as FunctionWidget<string>;
      const secondRow = state.resolvedSources['rowName[1]'] as FunctionWidget<string>;

      // The row entry is a callable wrapper whose path holds the row index (not the
      // `users.items.name` template path). It is resolved where it is read, with the row in scope.
      expect(typeof firstRow).toBe('function');
      expect(firstRow.path).toBe('users.0.name');
      expect(secondRow.path).toBe('users.1.name');

      const scope = state.repeaterItemScopes['rowName[1]'];
      expect(scope).toEqual({ itemPath: 'users.1', index: 1 });
      const resolved = secondRow({
        $form: state.data,
        $item: state.data['users'][1],
        $index: scope.index,
        errors: undefined,
        touched: undefined,
        translate: undefined,
      });
      expect(resolved.props?.['seenItemName']).toBe('Linus');
      expect(resolved.props?.['seenIndex']).toBe(1);
    });

    it('resolves an interpolated row prop per row', () => {
      const state = drive([init(makeRowScopeFormDef()), setData(rowScopeData)]);

      expect(propsOf(state, 'rowTotal[0]')['text']).toBe('Row 1: 2');
      expect(propsOf(state, 'rowTotal[1]')['text']).toBe('Row 2: 5');
    });

    it('recomputes row props and flags when the row data changes', () => {
      const state = drive([
        init(makeRowScopeFormDef()),
        setData(rowScopeData),
        setData({ lineItems: [{ quantity: 9, active: false }] }),
      ]);

      expect(propsOf(state, 'rowTotal[0]')['text']).toBe('Row 1: 9');
      expect(state.widgetFlags['quantity[0]']).toEqual({ hidden: true });
    });
  });

  // ---------------------------------------------------------------------------
  // 4. $fn host functions
  // ---------------------------------------------------------------------------

  describe('$fn host functions', () => {
    it('resolves $fn in a state expression, a flag when and an interpolation, and recomputes on SET_DATA', () => {
      const adult = drive([init(makeHostFunctionsFormDef()), setData({ age: 21, count: 4 })]);

      expect(adult.currentStates).toEqual(['adult']);
      expect(adult.widgetFlags['adultsOnly']).toEqual({ hidden: false });
      expect(propsOf(adult, 'doubled')['text']).toBe('Double: 8');

      const minor = drive([
        init(makeHostFunctionsFormDef()),
        setData({ age: 21, count: 4 }),
        setData({ age: 10, count: 5 }),
      ]);

      expect(minor.currentStates).toEqual([]);
      expect(minor.widgetFlags['adultsOnly']).toEqual({ hidden: true });
      expect(propsOf(minor, 'doubled')['text']).toBe('Double: 10');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Legacy `.items.` when tokens
  // ---------------------------------------------------------------------------

  describe('legacy .items. when tokens', () => {
    it('rewrites the token to the row index for every materialized row', () => {
      const state = drive([init(makeRowScopeFormDef()), setData(rowScopeData)]);

      expect(state.widgetFlags['legacyGate[0]']).toEqual({ hidden: false });
      expect(state.widgetFlags['legacyGate[1]']).toEqual({ hidden: true });

      // The row entry keeps the template expression. The flags stage rewrites it for the row
      // when it evaluates the condition.
      const rowEntry = state.resolvedSources['legacyGate[1]'] as DisplayWidget<string>;
      expect(rowEntry.include).toEqual({ when: '$form.lineItems.items.active === true' });
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Blur recompute for a row function widget
  // ---------------------------------------------------------------------------

  describe('blur recompute for a row function widget', () => {
    it('re-resolves the row function widget with touched, errors and $item / $index in scope', () => {
      const initial = drive([
        init(makeRowFunctionFormDef()),
        setData({ users: [{ name: 'Ada' }, { name: '' }] }),
      ]);
      expect(initial.calculatedWidgets['rowName[1]'].current.uid).toBe('rowName[1]');

      const reduce = makeReducer();
      const state = reduce(initial, blur('users.1.name', 'rowName[1]'));

      const current = state.calculatedWidgets['rowName[1]'].current as InputWidget<any, string>;

      // The row is recomputed with the blur outcome and its own item in scope.
      expect(current.props?.['seenTouched']).toBe(true);
      expect(current.props?.['seenItemName']).toBe('');
      expect(current.props?.['seenIndex']).toBe(1);

      expect(state.touched).toBe(true);
      expect(state.touchedControls['users.1.name']).toBe(true);

      // The stamped uid and path survive the recompute.
      expect(current.uid).toBe('rowName[1]');
      expect(current.path).toBe('users.1.name');

      // The row is validated under its own path, so it receives its own errors.
      expect(state.validations).toEqual({
        users: null,
        'users.0.name': null,
        'users.1.name': ['required'],
      });
      expect(current.props?.['seenErrors']).toEqual(['required']);

      // REFACTOR-NOTE: the blur-time re-resolve writes a fresh object into calculatedWidgets even
      // though the props pass produced an equal one. Goes away with the mount actions.
      expect(state.calculatedWidgets['rowName[1]']).not.toBe(
        initial.calculatedWidgets['rowName[1]'],
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 7. OVERRIDE_WIDGET_PROP re-validation gate
  // ---------------------------------------------------------------------------

  describe('OVERRIDE_WIDGET_PROP re-validation gate', () => {
    const override = (): Action => ({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: { uid: 'firstName', prop: 'placeholder', value: 'Your name' },
    });

    it('stores the override without validating when the form is untouched', () => {
      const state = drive([init(makeBaseFormDef()), setData({}), override()]);

      expect(state.widgetPropOverrides['firstName']).toEqual({ placeholder: 'Your name' });
      expect(propsOf(state, 'firstName')['placeholder']).toBe('Your name');
      expect(state.validations).toEqual({});
    });

    it('re-runs validation when it targets a touched input on a touched form', () => {
      const blurred = drive([
        init(makeBaseFormDef()),
        setData({}),
        blur('firstName', 'firstName'),
        // A plain data write does NOT re-validate, so the failure below is stale on purpose.
        setWidgetData('firstName', 'Joan'),
      ]);

      expect(blurred.touched).toBe(true);
      expect(blurred.touchedControls['firstName']).toBe(true);
      expect(blurred.validations['firstName']).toEqual(['required']);

      const reduce = makeReducer();
      const state = reduce(blurred, override());

      expect(state.validations['firstName']).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 8. INJECT_VALIDATION_ISSUES
  // ---------------------------------------------------------------------------

  describe('INJECT_VALIDATION_ISSUES', () => {
    it('updates injectedValidations and runs no derive', () => {
      const before = drive([init(makeBaseFormDef()), setData({ firstName: 'Joan', users: [{}] })]);

      const reduce = makeReducer();
      const after = reduce(before, {
        type: 'INJECT_VALIDATION_ISSUES',
        payload: { path: 'firstName', issues: ['taken'] },
      });

      expect(after.injectedValidations['firstName']).toEqual(['taken']);

      // No derive ran, so every derived map keeps its identity.
      expect(after.calculatedWidgets).toBe(before.calculatedWidgets);
      expect(after.widgetFlags).toBe(before.widgetFlags);
      expect(after.resolvedSources).toBe(before.resolvedSources);
      expect(after.repeaterItemScopes).toBe(before.repeaterItemScopes);
      expect(after.validations).toBe(before.validations);
    });

    it('clears injected issues with a null payload', () => {
      const state = drive([
        init(makeBaseFormDef()),
        { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'firstName', issues: ['taken'] } },
        { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'firstName', issues: null } },
      ]);

      expect(state.injectedValidations['firstName']).toBeNull();
    });

    // Landed in #265 (`214b7f28`). The issues have to be visible right away, and an untouched
    // control shows nothing.
    it('marks the path touched when the issues are not empty', () => {
      const state = drive([
        init(makeBaseFormDef()),
        setData({ firstName: 'Joan' }),
        { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'firstName', issues: ['taken'] } },
      ]);

      expect(state.touched).toBe(true);
      expect(state.touchedControls).toEqual({ firstName: true });
    });

    it('touches nothing when the issues are null or empty', () => {
      const cleared = drive([
        init(makeBaseFormDef()),
        setData({ firstName: 'Joan' }),
        { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'firstName', issues: null } },
      ]);

      expect(cleared.touched).toBe(false);
      expect(cleared.touchedControls).toEqual({});

      const empty = drive([
        init(makeBaseFormDef()),
        setData({ firstName: 'Joan' }),
        { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'firstName', issues: [] } },
      ]);

      expect(empty.touched).toBe(false);
      expect(empty.touchedControls).toEqual({});
    });

    it('leaves the already touched controls in place', () => {
      const state = drive([
        init(makeBaseFormDef()),
        setData({}),
        blur('firstName', 'firstName'),
        { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'users.0.name', issues: ['taken'] } },
      ]);

      expect(state.touchedControls).toEqual({ firstName: true, 'users.0.name': true });
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Deterministic position uids
  // ---------------------------------------------------------------------------

  describe('deterministic position uids', () => {
    it('derives row uids from the template position uid and keeps them round-trippable', () => {
      const state = drive([init(makePositionUidFormDef()), setData({ rows: [{}, {}] })]);

      // Inputs are keyed `<path>-<type>` by the decoder; everything else gets a position uid.
      expect(state.flatForm).toHaveProperty('#0.0');
      expect(state.flatForm).toHaveProperty('rows-repeater');

      expect(Object.keys(state.repeaterItemScopes).sort()).toEqual([
        '#0.1.t.0[0]',
        '#0.1.t.0[1]',
        '#0.1.t.1[0]',
        '#0.1.t.1[1]',
        '#0.1.t[0]',
        '#0.1.t[1]',
      ]);

      // The `[index]` suffix survives the position-uid format and is parsed back out of it, so
      // the row scope resolves and the interpolation sees the right $index.
      expect(propsOf(state, '#0.1.t.0[0]')['text']).toBe('Row 0');
      expect(propsOf(state, '#0.1.t.0[1]')['text']).toBe('Row 1');

      expect(state.widgetFlags['#0.1.t.1[0]']).toEqual({ hidden: false });
      expect(state.widgetFlags['#0.1.t.1[1]']).toEqual({ hidden: true });
    });
  });

  // ---------------------------------------------------------------------------
  // 10. Hidden widgets
  // ---------------------------------------------------------------------------

  describe('hidden widgets', () => {
    it('leaves calculatedWidgets while hidden and re-enters when visible again', () => {
      const visible = drive([init(makeBaseFormDef()), setData({ age: 21 })]);
      expect(visible.calculatedWidgets).toHaveProperty('bio');

      const reduce = makeReducer();
      const hidden = reduce(visible, setData({ age: 10 }));

      expect(hidden.widgetFlags['bio']).toEqual({ hidden: true });
      expect(hidden.calculatedWidgets).not.toHaveProperty('bio');

      const visibleAgain = reduce(hidden, setData({ age: 30 }));
      expect(visibleAgain.widgetFlags['bio']).toEqual({ hidden: false });
      expect(visibleAgain.calculatedWidgets['bio'].current.uid).toBe('bio');
    });

    it('never validates a hidden input, even when it is required and empty', () => {
      const state = drive([init(makeGatedInputFormDef()), setData({ age: 10 })]);

      // Hidden: it never reaches calculatedWidgets, which is what validateAll reads.
      expect(state.widgetFlags['secret']).toEqual({ hidden: true });
      expect(state.calculatedWidgets).not.toHaveProperty('secret');

      const reduce = makeReducer();
      const validated = reduce(state, validateAllAction);

      expect(validated.validations).toEqual({});
      expect(validated.touchedControls).toEqual({});
      expect(validated.isFormValid).toBe(true);
    });

    it('prunes a hidden plain input and a hidden repeater row input', () => {
      const plain = drive([init(makeGatedInputFormDef()), setData({ age: 10, secret: 'shh' })]);

      expect(plain.widgetFlags['secret']).toEqual({ hidden: true });
      expect(pruneHiddenData(plain)).toEqual({ age: 10 });

      const rows = drive([init(makeRowScopeFormDef()), setData(rowScopeData)]);

      expect(rows.widgetFlags['quantity[1]']).toEqual({ hidden: true });
      // `pruneHiddenData` looks the flagged uid up in `resolvedSources`, which holds row widgets
      // with their concrete path, so the hidden row value is removed.
      const pruned = pruneHiddenData(rows);
      expect(pruned['lineItems'][1]).not.toHaveProperty('quantity');
      expect(pruned['lineItems'][0]).toEqual(rowScopeData.lineItems[0]);
    });
  });

  // ---------------------------------------------------------------------------
  // 11. VALIDATE_ALL
  // ---------------------------------------------------------------------------

  describe('VALIDATE_ALL', () => {
    it('touches and validates every visible input, rendered or not, and recomputes isFormValid', () => {
      const state = drive([init(makeBaseFormDef()), setData({ age: 21 }), validateAllAction]);

      expect(state.touched).toBe(true);
      expect(state.allControlsValidated).toBe(true);
      // The repeater is an input too. `bio` is a display widget and is never touched.
      expect(state.touchedControls).toEqual({ firstName: true, users: true });
      expect(state.validations).toEqual({ firstName: ['required'], users: null });
      expect(state.isFormValid).toBe(false);
    });

    it('drops a touched path no input owns and rebuilds the touched set from the visible inputs', () => {
      // A blur can carry any path. One that no input owns is dropped by the derive right away.
      const blurred = drive([init(makeBaseFormDef()), setData({}), blur('ghost', 'firstName')]);
      expect(blurred.touched).toBe(true);
      expect(blurred.touchedControls).toEqual({});

      const reduce = makeReducer();
      const state = reduce(blurred, validateAllAction);

      expect(state.touchedControls).toEqual({ firstName: true, users: true });
    });

    it('touches and validates an input the validation itself reveals, in the same dispatch', () => {
      const state = drive([init(makeSubmitRevealFormDef()), setData({}), validateAllAction]);

      // `afterSubmitOnly` was hidden until `$formIsInvalid` became true.
      expect(state.widgetFlags['afterSubmitOnly']).toEqual({ hidden: false });
      expect(state.calculatedWidgets).toHaveProperty('afterSubmitOnly');
      expect(state.touchedControls).toEqual({ firstName: true, afterSubmitOnly: true });
      expect(state.validations).toEqual({ firstName: ['required'], afterSubmitOnly: ['required'] });
      expect(state.isFormValid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 12. Validation-driven expressions
  // ---------------------------------------------------------------------------

  describe('validation-driven expressions', () => {
    it('feeds $errors and $formIsInvalid into states, flags and props', () => {
      const initial = drive([init(makeValidationDrivenFormDef()), setData({})]);

      expect(initial.currentStates).toEqual([]);
      expect(initial.widgetFlags['nameHint']).toEqual({ hidden: true });
      expect(initial.widgetFlags['submit']).toEqual({ disabled: false });

      const reduce = makeReducer();
      const blurred = reduce(initial, blur('firstName', 'firstName'));

      expect(blurred.validations).toEqual({ firstName: ['required'] });
      expect(blurred.currentStates).toEqual(['broken']);
      expect(blurred.widgetFlags['nameHint']).toEqual({ hidden: false });
      expect(blurred.widgetFlags['submit']).toEqual({ disabled: true });
      // The `disabled: { when }` field of a computed widget mirrors its flag.
      const submit = blurred.calculatedWidgets['submit'].current as ActionWidget<string>;
      expect(submit.disabled).toBe(true);
      expect(blurred.isFormValid).toBe(false);
    });

    it('does not validate on a data change: the errors stay until the next trigger', () => {
      const blurred = drive([
        init(makeValidationDrivenFormDef()),
        setData({}),
        blur('firstName', 'firstName'),
      ]);

      const reduce = makeReducer();
      const filledIn = reduce(blurred, setData({ firstName: 'Joan' }));

      // The value is valid now, but nothing re-ran the validators, so the failure is still there
      // and everything derived from it still reads as invalid.
      expect(filledIn.validations).toEqual({ firstName: ['required'] });
      expect(filledIn.currentStates).toEqual(['broken']);
      expect(filledIn.widgetFlags['submit']).toEqual({ disabled: true });
      expect(filledIn.isFormValid).toBe(false);

      const revalidated = reduce(filledIn, {
        type: 'ATTEMPT_VALIDATION',
        payload: { reason: 'change', path: 'firstName', uid: 'firstName' },
      });

      expect(revalidated.validations).toEqual({ firstName: null });
      expect(revalidated.currentStates).toEqual([]);
      expect(revalidated.widgetFlags['submit']).toEqual({ disabled: false });
      expect(revalidated.isFormValid).toBe(true);
    });

    it('runs no validation until a validation action, whatever the data does', () => {
      const state = drive(
        [
          init(makeBaseFormDef()),
          setData({ firstName: 'J' }),
          setWidgetData('firstName', 'Jo'),
          {
            type: 'ATTEMPT_VALIDATION',
            payload: { reason: 'change', path: 'firstName', uid: 'firstName' },
          },
        ],
        'blur',
      );

      expect(state.validations).toEqual({});
      expect(state.touched).toBe(false);
    });

    it('counts injected issues in isFormValid but not in $errors / $formIsInvalid', () => {
      const injected = drive([
        init(makeValidationDrivenFormDef()),
        setData({ firstName: 'Joan' }),
        { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'firstName', issues: ['taken'] } },
      ]);

      // Injecting alone recomputes nothing, isFormValid included.
      expect(injected.isFormValid).toBe(true);

      const reduce = makeReducer();
      const state = reduce(injected, validateAllAction);

      // The schema validators pass, so the only failure is the injected one: isFormValid sees it,
      // the expression variables do not (they are built from `validations` only).
      expect(state.validations).toEqual({ firstName: null });
      expect(state.isFormValid).toBe(false);
      expect(state.currentStates).toEqual([]);
      expect(state.widgetFlags['nameHint']).toEqual({ hidden: true });
      expect(state.widgetFlags['submit']).toEqual({ disabled: false });
    });
  });

  // ---------------------------------------------------------------------------
  // 13. Form health
  // ---------------------------------------------------------------------------

  describe('form health', () => {
    it('reports an errored form when a prop interpolation throws, and computes no props', () => {
      const state = drive([init(makeBrokenInterpolationFormDef()), setData({ age: 21 })]);

      expect(state.formHealth).toEqual({
        status: 'errored',
        message:
          "[40] Failed to evaluate '{{$form.missing.deep}}': Cannot read properties of undefined (reading 'deep')",
        code: 40,
      });

      // States and flags ran, the props pass threw before writing anything.
      expect(state.currentStates).toEqual(['adult']);
      expect(state.calculatedWidgets['oops'].current).toEqual({});
      expect(state.calculatedWidgets['fine'].current).toEqual({});
    });

    it('recovers from an interpolation error as soon as the data computes again', () => {
      const errored = drive([init(makeBrokenInterpolationFormDef()), setData({ age: 21 })]);
      expect(errored.formHealth.status).toBe('errored');

      const reduce = makeReducer();
      const state = reduce(errored, setData({ age: 10, missing: { deep: 'there' } }));

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(propsOf(state, 'oops')['text']).toBe('Hi there');
      expect(propsOf(state, 'fine')['text']).toBe('plain');
      // The states are computed again too, they are not frozen at the errored values.
      expect(state.currentStates).toEqual([]);
    });

    it('reports code 11 when a when condition throws, keeps the last good widgets, and recovers', () => {
      const ok = drive([init(makeBrokenWhenFormDef()), setData({ missing: { deep: 1 } })]);
      expect(ok.formHealth).toEqual({ status: 'ok' });
      expect(ok.widgetFlags['gate']).toEqual({ hidden: false });
      expect(propsOf(ok, 'fine')['text']).toBe('plain');

      const reduce = makeReducer();
      const errored = reduce(ok, setData({}));

      expect(errored.formHealth.status).toBe('errored');
      if (errored.formHealth.status === 'errored') {
        expect(errored.formHealth.code).toBe(11);
        expect(errored.formHealth.message.startsWith('[11] ')).toBe(true);
      }
      // The data change is applied, nothing computed from it is.
      expect(errored.data).toEqual({});
      expect(errored.calculatedWidgets).toBe(ok.calculatedWidgets);
      expect(errored.widgetFlags).toBe(ok.widgetFlags);

      const healed = reduce(errored, setData({ missing: { deep: 2 } }));
      expect(healed.formHealth).toEqual({ status: 'ok' });
      expect(healed.widgetFlags['gate']).toEqual({ hidden: true });
    });

    it('recovers from a state error set through SET_FORM_HEALTH on the next derive', () => {
      const state = drive([
        init(makeBaseFormDef()),
        setData({ age: 21 }),
        {
          type: 'SET_FORM_HEALTH',
          payload: { formHealth: { status: 'errored', code: 10, message: '[10] boom' } },
        },
        setData({ age: 22 }),
      ]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.currentStates).toEqual(['adult']);
    });

    it('freezes the derive while an error set outside of it stands', () => {
      const frozen = drive([
        init(makeBaseFormDef()),
        setData({ age: 21 }),
        {
          type: 'SET_FORM_HEALTH',
          payload: { formHealth: { status: 'errored', code: 30, message: '[30] no widget' } },
        },
      ]);

      const reduce = makeReducer();
      const state = reduce(frozen, setData({ age: 10 }));

      // The data change is stored, nothing is computed from it.
      expect(state.formHealth).toEqual({ status: 'errored', code: 30, message: '[30] no widget' });
      expect(state.data).toEqual({ age: 10 });
      expect(state.calculatedWidgets).toBe(frozen.calculatedWidgets);
      expect(state.widgetFlags).toBe(frozen.widgetFlags);
      expect(state.currentStates).toEqual(['adult']);
    });

    it('SET_FORM_HEALTH sets the status without running any stage', () => {
      const errored = drive([init(makeBrokenInterpolationFormDef()), setData({})]);
      expect(errored.formHealth.status).toBe('errored');

      const reduce = makeReducer();
      const state = reduce(errored, {
        type: 'SET_FORM_HEALTH',
        payload: { formHealth: { status: 'ok' } },
      });

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.calculatedWidgets).toBe(errored.calculatedWidgets);
      expect(state.widgetFlags).toBe(errored.widgetFlags);
    });
  });

  // ---------------------------------------------------------------------------
  // 14. Removed repeater rows
  // ---------------------------------------------------------------------------

  describe('removed repeater rows', () => {
    it('drops everything a removed row owned and keeps the surviving rows', () => {
      const twoRows = drive([
        init(makeBaseFormDef()),
        setData({ users: [{}, {}] }),
        validateAllAction,
        {
          type: 'OVERRIDE_WIDGET_PROP',
          payload: { uid: 'name[1]', prop: 'placeholder', value: 'Second' },
        },
        { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'users.1.name', issues: ['taken'] } },
      ]);
      expect(twoRows.touchedControls['users.1.name']).toBe(true);
      expect(twoRows.validations['users.1.name']).toBeNull();
      expect(twoRows.widgetPropOverrides['name[1]']).toEqual({ placeholder: 'Second' });
      expect(twoRows.injectedValidations['users.1.name']).toEqual(['taken']);

      const reduce = makeReducer();
      const oneRow = reduce(twoRows, setData({ users: [{}] }));

      expect(oneRow.resolvedSources).not.toHaveProperty('name[1]');
      expect(oneRow.resolvedSources).not.toHaveProperty('usersRow[1]');
      expect(oneRow.repeaterItemScopes).not.toHaveProperty('name[1]');
      expect(oneRow.calculatedWidgets).not.toHaveProperty('name[1]');
      expect(oneRow.calculatedWidgets).not.toHaveProperty('usersRow[1]');
      expect(oneRow.widgetPropOverrides).not.toHaveProperty('name[1]');
      expect(oneRow.touchedControls).not.toHaveProperty('users.1.name');
      expect(oneRow.validations).not.toHaveProperty('users.1.name');
      expect(oneRow.injectedValidations).not.toHaveProperty('users.1.name');

      expect(oneRow.calculatedWidgets).toHaveProperty('name[0]');
      expect(oneRow.calculatedWidgets).toHaveProperty('usersRow[0]');
      expect(oneRow.touchedControls['users.0.name']).toBe(true);
      expect(oneRow.validations['users.0.name']).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 15. Layout children
  // ---------------------------------------------------------------------------

  describe('layout children', () => {
    it('reports only the visible children of a layout', () => {
      const minor = drive([init(makeLayoutFormDef()), setData({ age: 10 })]);
      expect(childUidsOf(minor, 'card')).toEqual(['firstName']);

      const adult = drive([init(makeLayoutFormDef()), setData({ age: 21 })]);
      expect(childUidsOf(adult, 'card')).toEqual(['firstName', 'bio']);
    });

    it('filters a row layout by the row flags but leaves the child uids unstamped', () => {
      const state = drive([init(makeRowScopeFormDef()), setData(rowScopeData)]);

      // The layout's own uid carries the row index...
      expect((state.calculatedWidgets['lineItemsRow[0]'].current as LayoutWidget<string>).uid).toBe(
        'lineItemsRow[0]',
      );
      // ...while its children keep the template uids. Visibility is still resolved per row: the
      // lookup stamps the index on before reading widgetFlags.
      expect(childUidsOf(state, 'lineItemsRow[0]')).toEqual([
        'quantity',
        'firstRowBadge',
        'rowTotal',
        'legacyGate',
      ]);
      expect(childUidsOf(state, 'lineItemsRow[1]')).toEqual(['rowTotal']);
    });
  });

  // ---------------------------------------------------------------------------
  // 16. Nested repeaters
  // ---------------------------------------------------------------------------

  describe('nested repeaters', () => {
    it('scopes inner rows to the innermost item and materializes both index levels', () => {
      const state = drive([init(makeNestedRepeaterFormDef()), setData(nestedRepeaterData)]);

      expect(state.formHealth.status).toBe('ok');

      // The inner repeater widget itself belongs to the OUTER item.
      expect(state.repeaterItemScopes['devs[0]']).toEqual({ itemPath: 'teams.0', index: 0 });
      // Its template descendants belong to the inner item, and $index is the inner position.
      expect(state.repeaterItemScopes['devName[0][1]']).toEqual({
        itemPath: 'teams.0.devs.1',
        index: 1,
      });
      expect(state.repeaterItemScopes['devName[1][0]']).toEqual({
        itemPath: 'teams.1.devs.0',
        index: 0,
      });

      // The inner repeater container is an entry of its own with a concrete path.
      expect((state.resolvedSources['devs[0]'] as InputWidget<any, string>).path).toBe(
        'teams.0.devs',
      );
      expect((state.resolvedSources['devName[0][1]'] as InputWidget<any, string>).path).toBe(
        'teams.0.devs.1.name',
      );

      // `$item` resolves against the inner item at both levels.
      expect(state.widgetFlags['devName[0][0]']).toEqual({ hidden: false });
      expect(state.widgetFlags['devName[0][1]']).toEqual({ hidden: true });
      expect(state.widgetFlags['devName[1][0]']).toEqual({ hidden: false });
    });

    it('resolves an interpolated prop of an inner row', () => {
      const state = drive([init(makeNestedRepeaterFormDef()), setData(nestedRepeaterData)]);

      expect(propsOf(state, 'devLabel[0][1]')['text']).toBe('dev 1: Linus');
      expect(propsOf(state, 'devLabel[1][0]')['text']).toBe('dev 0: Grace');
    });

    it('flags the outer repeater and the nested one', () => {
      const state = drive([
        init(makeGatedNestedRepeaterFormDef()),
        setData({
          showTeams: true,
          teams: [
            { showDevs: false, devs: [{ name: 'Ada' }] },
            { showDevs: true, devs: [{ name: 'Grace' }] },
          ],
        }),
      ]);

      // The outer repeater is in flatForm, so its `include.when` is evaluated.
      expect(state.widgetFlags['teams']).toEqual({ hidden: false });

      // The nested repeater container is an entry of `resolvedSources` (scoped to the outer
      // item), so the flags stage evaluates its `include.when` against `$item` per outer row.
      expect(state.repeaterItemScopes['devs[0]']).toEqual({ itemPath: 'teams.0', index: 0 });
      expect((state.resolvedSources['devs[0]'] as InputWidget<any, string>).path).toBe(
        'teams.0.devs',
      );
      expect(state.widgetFlags['devs[0]']).toEqual({ hidden: true });
      expect(state.widgetFlags['devs[1]']).toEqual({ hidden: false });

      // Its rows are expanded regardless of the gate.
      expect((state.resolvedSources['devName[0][0]'] as InputWidget<any, string>).path).toBe(
        'teams.0.devs.0.name',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 17. Action routing
  // ---------------------------------------------------------------------------

  describe('action routing', () => {
    it('SET_META replaces meta wholesale and reruns states, flags and props', () => {
      const dev = drive([
        init(makeMetaFormDef()),
        { type: 'SET_META', payload: { meta: { debug: true, mode: 'dev' } } },
      ]);

      expect(dev.currentStates).toEqual(['debug']);
      expect(dev.widgetFlags['debugOnly']).toEqual({ hidden: false });
      expect(propsOf(dev, 'banner')['text']).toBe('Mode dev');

      const reduce = makeReducer();
      const prod = reduce(dev, { type: 'SET_META', payload: { meta: { mode: 'prod' } } });

      // The payload is the new meta, not a patch: `debug` is gone.
      expect(prod.meta).toEqual({ mode: 'prod' });
      expect(prod.currentStates).toEqual([]);
      expect(prod.widgetFlags['debugOnly']).toEqual({ hidden: true });
      expect(propsOf(prod, 'banner')['text']).toBe('Mode prod');
    });

    it('SET_LANGUAGE recomputes props only, leaving every other map untouched', () => {
      const before = drive([
        init(makeBaseFormDef()),
        setData({ age: 21, users: [{ name: 'Ada' }] }),
      ]);

      const reduce = makeReducer();
      const after = reduce(before, { type: 'SET_LANGUAGE', payload: { lang: 'fr-FR' } });

      expect(after.lang).toBe('fr-FR');
      expect(after.data).toBe(before.data);
      expect(after.currentStates).toBe(before.currentStates);
      expect(after.widgetFlags).toBe(before.widgetFlags);
      expect(after.resolvedSources).toBe(before.resolvedSources);
      expect(after.repeaterItemScopes).toBe(before.repeaterItemScopes);
      expect(after.validations).toBe(before.validations);
      // Nothing a prop depends on changed, so the widget entry keeps its reference.
      expect(after.calculatedWidgets['firstName']).toBe(before.calculatedWidgets['firstName']);
    });

    it('SET_LANGUAGE does run the props stage', () => {
      const before = drive([init(makeHostFunctionsFormDef()), setData({ count: 4 })]);
      expect(propsOf(before, 'doubled')['text']).toBe('Double: 8');

      // Swapping the data without going through a reducer isolates the props stage: only a rerun
      // can pick the new value up.
      const reduce = makeReducer();
      const after = reduce(
        { ...before, data: { count: 5 } },
        { type: 'SET_LANGUAGE', payload: { lang: 'fr-FR' } },
      );

      expect(propsOf(after, 'doubled')['text']).toBe('Double: 10');
    });

    it('ATTEMPT_VALIDATION ignores a reason the form does not validate on', () => {
      const initial = drive([init(makeBaseFormDef()), setData({})], 'blur');

      const reduce = makeReducer('blur');
      const onChange = reduce(initial, {
        type: 'ATTEMPT_VALIDATION',
        payload: { reason: 'change', path: 'firstName', uid: 'firstName' },
      });

      // Not merely equivalent: the reducer returns the very same state.
      expect(onChange).toBe(initial);

      const onBlur = reduce(initial, blur('firstName', 'firstName'));

      expect(onBlur.touched).toBe(true);
      expect(onBlur.validations).toEqual({ firstName: ['required'], users: null });
    });

    it('INITIALIZE starts over: data and every derived map are reset', () => {
      const state = drive([
        init(makeBaseFormDef()),
        setData({ age: 21, firstName: 'Joan', users: [{ name: 'Ada' }] }),
        validateAllAction,
        init(makeBaseFormDef()),
      ]);

      expect(state.data).toEqual({});
      expect(state.calculatedWidgets).toEqual({});
      expect(state.widgetFlags).toEqual({});
      expect(state.repeaterItemScopes).toEqual({});
      expect(Object.keys(state.resolvedSources).sort()).toEqual(Object.keys(state.flatForm).sort());
      expect(state.currentStates).toEqual([]);
      expect(state.validations).toEqual({});
      expect(state.touched).toBe(false);
      expect(state.touchedControls).toEqual({});
    });
  });

  // ---------------------------------------------------------------------------
  // 18. Inputs that appear after a submit attempt (#263)
  // ---------------------------------------------------------------------------

  describe('inputs that appear after a submit attempt', () => {
    // The gate is `allControlsValidated` (a VALIDATE_ALL pass ran), not `touched` (any blur
    // happened). The shared Cypress describe "Error visibility of inputs revealed after form
    // interaction" in `libs/ui-testing/src/lib/core-features/include-exclude.cy.ts` covers the
    // same rule from the DOM side.
    it('does not touch a revealed input when only a blur elsewhere happened', () => {
      const blurredElsewhere = drive([
        init(makeGatedInputWithSiblingFormDef()),
        setData({ age: 10 }),
        blur('nickname', 'nickname'),
      ]);
      expect(blurredElsewhere.touched).toBe(true);
      expect(blurredElsewhere.allControlsValidated).toBe(false);

      const reduce = makeReducer();
      const state = reduce(blurredElsewhere, setData({ age: 21 }));

      // The input is now visible and empty, but nothing submitted yet, so it stays untouched and
      // shows no error.
      expect(state.widgetFlags['secret']).toEqual({ hidden: false });
      expect(state.calculatedWidgets).toHaveProperty('secret');
      expect(state.touchedControls).toEqual({ nickname: true });
      expect(state.validations['secret']).toBeUndefined();
    });

    it('touches AND validates a required input revealed after VALIDATE_ALL', () => {
      const validated = drive([
        init(makeGatedInputFormDef()),
        setData({ age: 10 }),
        validateAllAction,
      ]);
      expect(validated.allControlsValidated).toBe(true);
      expect(validated.isFormValid).toBe(true);

      const reduce = makeReducer();
      const state = reduce(validated, setData({ age: 21 }));

      // Touched, validated and counted against the form, all in the same dispatch.
      expect(state.touchedControls).toEqual({ secret: true });
      expect(state.validations['secret']).toEqual(['required']);
      expect(state.isFormValid).toBe(false);
    });

    it('touches AND validates the required input of a repeater row added after VALIDATE_ALL', () => {
      const validated = drive([
        init(makeRequiredRowsFormDef()),
        setData({ users: [{ name: 'Ada' }] }),
        validateAllAction,
      ]);
      expect(validated.isFormValid).toBe(true);
      expect(validated.touchedControls).toEqual({ users: true, 'users.0.name': true });

      const reduce = makeReducer();
      const state = reduce(validated, setWidgetData('users', [{ name: 'Ada' }, {}]));

      expect(state.touchedControls['users.1.name']).toBe(true);
      expect(state.validations['users.1.name']).toEqual(['required']);
      expect(state.isFormValid).toBe(false);
    });

    it('touches nothing while the form is untouched', () => {
      const state = drive([
        init(makeRequiredRowsFormDef()),
        setData({ users: [{}] }),
        setWidgetData('users', [{}, {}]),
      ]);

      expect(state.touched).toBe(false);
      expect(state.touchedControls).toEqual({});
      expect(state.validations).toEqual({});
    });
  });

  // ---------------------------------------------------------------------------
  // 19. Actions that address a widget calculatedWidgets does not hold
  // ---------------------------------------------------------------------------

  describe('actions that address a widget calculatedWidgets does not hold', () => {
    // Both actions carry a uid. A hidden widget or one that is not in the form has no entry, and
    // neither action may throw for it: OVERRIDE_WIDGET_PROP is a public API called from event
    // handlers, and ATTEMPT_VALIDATION rides on DOM events that can outlive a mount.
    it('OVERRIDE_WIDGET_PROP warns and returns the same state for an unknown uid', () => {
      const initial = drive([init(makeBaseFormDef()), setData({})]);
      expect(initial.calculatedWidgets).not.toHaveProperty('bio');

      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const reduce = makeReducer();

      const hidden = reduce(initial, {
        type: 'OVERRIDE_WIDGET_PROP',
        payload: { uid: 'bio', prop: 'text', value: 'hello' },
      });
      expect(hidden).toBe(initial);
      expect(warn).toHaveBeenCalledWith('Widget with uid "bio" not found');

      const unknown = reduce(initial, {
        type: 'OVERRIDE_WIDGET_PROP',
        payload: { uid: 'ghost', prop: 'text', value: 'hello' },
      });
      expect(unknown).toBe(initial);
      expect(warn).toHaveBeenCalledWith('Widget with uid "ghost" not found');
      warn.mockRestore();
    });

    it('ATTEMPT_VALIDATION with an unknown uid still touches and validates the path', () => {
      const initial = drive([init(makeBaseFormDef()), setData({})]);

      const reduce = makeReducer();
      const state = reduce(initial, blur('firstName', 'bio'));

      expect(state.touched).toBe(true);
      expect(state.touchedControls).toEqual({ firstName: true });
      expect(state.validations['firstName']).toEqual(['required']);
    });
  });

  // ---------------------------------------------------------------------------
  // 20. Reference stability across recomputes
  // ---------------------------------------------------------------------------

  describe('reference stability across recomputes', () => {
    /** A row display widget whose only prop is rebuilt from the row on every recompute. */
    const makeRowTagsWidget = () => ({
      uid: 'rowTags',
      kind: 'display',
      type: 'heading',
      props: { tags: ({ $item }: { $item: any }) => [$item.name] },
    });

    const makeRefFormDef = () => ({
      form: [
        {
          uid: 'firstName',
          kind: 'input',
          type: 'textinput',
          path: 'firstName',
          props: { hint: 'Hi {{$form.firstName}}' },
        },
        {
          uid: 'users',
          kind: 'input',
          type: 'repeater',
          path: 'users',
          props: {
            template: {
              uid: 'usersRow',
              kind: 'layout',
              type: 'flex',
              children: [makeRowTagsWidget()],
            },
          },
        },
      ],
    });

    it('keeps the widget references an unrelated input change does not affect', () => {
      const initial = drive([
        init(makeRefFormDef()),
        setData({ firstName: 'Joan', users: [{ name: 'Ada' }, { name: 'Linus' }] }),
      ]);

      const reduce = makeReducer();
      const state = reduce(
        initial,
        setData({ firstName: 'Grace', users: [{ name: 'Ada' }, { name: 'Linus' }] }),
      );

      // The prop function returns a new array every run, so only its content can decide this.
      expect(propsOf(state, 'rowTags[0]')['tags']).toEqual(['Ada']);
      expect(state.calculatedWidgets['rowTags[0]']).toBe(initial.calculatedWidgets['rowTags[0]']);
      expect(state.calculatedWidgets['rowTags[1]']).toBe(initial.calculatedWidgets['rowTags[1]']);
      expect(state.calculatedWidgets['usersRow[0]']).toBe(initial.calculatedWidgets['usersRow[0]']);
      expect(state.calculatedWidgets['users']).toBe(initial.calculatedWidgets['users']);

      // The widget that does depend on the changed value gets a new reference.
      expect(state.calculatedWidgets['firstName']).not.toBe(initial.calculatedWidgets['firstName']);
      expect(propsOf(state, 'firstName')['hint']).toBe('Hi Grace');
    });

    it('gives a row widget a new reference when its own row data changes', () => {
      const initial = drive([
        init(makeRefFormDef()),
        setData({ firstName: 'Joan', users: [{ name: 'Ada' }] }),
      ]);

      const reduce = makeReducer();
      const state = reduce(initial, setData({ firstName: 'Joan', users: [{ name: 'Grace' }] }));

      expect(state.calculatedWidgets['rowTags[0]']).not.toBe(
        initial.calculatedWidgets['rowTags[0]'],
      );
      expect(propsOf(state, 'rowTags[0]')['tags']).toEqual(['Grace']);
    });

    it('keeps a row function widget reference when it returns an equal config', () => {
      const initial = drive([
        init(makeRowFunctionFormDef()),
        setData({ users: [{ name: 'Ada' }] }),
      ]);

      const reduce = makeReducer();
      const unchanged = reduce(initial, setData({ users: [{ name: 'Ada' }] }));
      const changed = reduce(unchanged, setData({ users: [{ name: 'Grace' }] }));

      expect(unchanged.calculatedWidgets['rowName[0]']).toBe(
        initial.calculatedWidgets['rowName[0]'],
      );
      expect(changed.calculatedWidgets['rowName[0]']).not.toBe(
        unchanged.calculatedWidgets['rowName[0]'],
      );
      expect(propsOf(changed, 'rowName[0]')['seenItemName']).toBe('Grace');
    });
  });
});
