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
import { makeRepeaterItemConfig } from '../utils/repeater';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * End-to-end reducer baseline. Unlike the per-reducer specs, which place widgets into
 * `state.calculatedWidgets` by hand, this drives the REAL reducer through realistic action
 * sequences and asserts the resulting state.
 *
 * It is a characterization suite: it records how the pipeline behaves TODAY, so that the work that
 * moves the form store to a data-driven pipeline has an executable description of what it must not
 * break. That work is done in numbered steps, and the tags below name the step that changes an
 * assertion.
 *
 * Three kinds of tags appear below:
 * - `BASELINE (flips in step NN)` marks an assertion that step NN deliberately changes. Step 02
 *   replaced the repeater row walk (its two pins are flipped already), step 05 replaces the
 *   mount-driven pipeline with a single derive. When the step lands, the flipped assertion
 *   documents exactly what changed.
 * - `REFACTOR-NOTE` marks a mount-driven mechanic that disappears entirely when the mount actions
 *   (`ADD_WIDGET`, `REMOVE_WIDGET`, `SET_WIDGET_INITIAL_DATA`) are removed in step 12.
 * - `FINDING` marks behavior that is recorded because it is what happens today, not because it is
 *   what should happen. Fixing one of these should turn its pin red on purpose.
 *
 * Everything else is a plain assertion: behavior that must survive the whole change.
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

const addWidget = (widget: FormWidget<string>): Action => ({
  type: 'ADD_WIDGET',
  payload: { widget },
});

/** Reads a repeater's decoded `props.template`, the layout widget the renderer mounts per row. */
const repeaterTemplate = (state: State, repeaterUid: string): LayoutWidget<string> => {
  const repeater = state.flatForm[repeaterUid] as InputWidget<any, string>;
  return (repeater.props as { template: LayoutWidget<string> }).template;
};

/**
 * Reads a widget out of a repeater's decoded `props.template`. Template descendants never reach
 * `flatForm`, so this is how a test gets hold of the exact object the renderer materializes.
 */
const templateChild = (state: State, repeaterUid: string, childUid: string): FormWidget<string> => {
  const template = repeaterTemplate(state, repeaterUid);
  const child = template.children.find((candidate) => candidate.uid === childUid);
  if (!child) {
    throw new Error(`Template child "${childUid}" not found in repeater "${repeaterUid}"`);
  }
  return child as FormWidget<string>;
};

/** Mounts a repeater template widget for one concrete row, exactly like the renderers do. */
const mountRow = (widget: FormWidget<string>, repeaterIndexes: number[]): Action =>
  addWidget(makeRepeaterItemConfig(widget, repeaterIndexes));

const propsOf = (state: State, uid: string): Record<string, any> =>
  (state.calculatedWidgets[uid].current as NonFunctionWidget<string>).props ?? {};

/** The uids a mounted layout reports as its children, in order. */
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
 * The same gated required input plus an always-visible sibling, so a test can blur a registered
 * widget before the gated one mounts.
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

describe('reducer end-to-end baseline', () => {
  // ---------------------------------------------------------------------------
  // 1. Mount-driven widget registry
  // ---------------------------------------------------------------------------

  describe('mount-driven widget registry', () => {
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

      // BASELINE (flips in step 05): INITIALIZE runs no calculation today.
      expect(state.calculatedWidgets).toEqual({});
      expect(state.currentStates).toEqual([]);
      expect(state.widgetFlags).toEqual({});
      expect(state.validations).toEqual({});
      expect(state.data).toEqual({});
    });

    it('SET_DATA computes states, flags and repeater rows but leaves calculatedWidgets empty', () => {
      const state = drive([
        init(makeBaseFormDef()),
        setData({ firstName: 'Joan', users: [{}, {}] }),
      ]);

      expect(state.formHealth.status).toBe('ok');
      expect(state.data).toEqual({ firstName: 'Joan', users: [{}, {}] });

      // `age` is undefined, so the `adult` state is inactive and the gated display is hidden.
      expect(state.currentStates).toEqual([]);
      expect(state.widgetFlags['bio']).toEqual({ hidden: true });

      // Every repeater row is expanded from the array data, whether or not it is mounted, next to
      // the static widgets. The template's own layout widget is expanded per row as well.
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

      // BASELINE (flips in step 05): calculatedWidgets only ever covers widgets whose component
      // has mounted; none have, so it stays empty even though the data is set.
      expect(state.calculatedWidgets).toEqual({});
    });

    it('activates a declared state when its expression becomes true', () => {
      const state = drive([init(makeBaseFormDef()), setData({ age: 21, users: [{}] })]);

      expect(state.currentStates).toEqual(['adult']);
      expect(state.widgetFlags['bio']).toEqual({ hidden: false });
    });

    // REFACTOR-NOTE: ADD_WIDGET / REMOVE_WIDGET disappear in step 12. Until then they are the
    // only way a widget enters or leaves calculatedWidgets.
    it('ADD_WIDGET computes exactly the widget that mounted, and nothing else', () => {
      const initialized = drive([init(makeBaseFormDef()), setData({ firstName: 'Joan' })]);

      // BASELINE (flips in step 05): nothing is calculated before a component mounts.
      expect(initialized.calculatedWidgets).toEqual({});

      const state = drive([
        init(makeBaseFormDef()),
        setData({ firstName: 'Joan' }),
        addWidget(initialized.flatForm['firstName']),
      ]);

      expect(Object.keys(state.calculatedWidgets)).toEqual(['firstName']);
      const current = state.calculatedWidgets['firstName'].current as InputWidget<any, string>;
      expect(current.uid).toBe('firstName');
      expect(current.kind).toBe('input');
      expect(current.type).toBe('textinput');
      expect(current.path).toBe('firstName');

      expect(state.calculatedWidgets).not.toHaveProperty('bio');
      expect(state.calculatedWidgets).not.toHaveProperty('users');
    });

    // REFACTOR-NOTE: unmount-driven cleanup, deleted in step 12.
    it('REMOVE_WIDGET drops the uid again', () => {
      const initialized = drive([init(makeBaseFormDef())]);

      const state = drive([
        init(makeBaseFormDef()),
        setData({ firstName: 'Joan' }),
        addWidget(initialized.flatForm['firstName']),
        { type: 'REMOVE_WIDGET', payload: { uid: 'firstName' } },
      ]);

      expect(state.calculatedWidgets).not.toHaveProperty('firstName');
      expect(state.calculatedWidgets).toEqual({});
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Initial data
  // ---------------------------------------------------------------------------

  describe('initial data defaulting', () => {
    // REFACTOR-NOTE: SET_WIDGET_INITIAL_DATA is dispatched on mount and disappears in step 12.
    it('BASELINE (flips in step 05: cleared stays cleared): writes the default when the value is undefined', () => {
      const state = drive([
        init(makeBaseFormDef()),
        setData({}),
        { type: 'SET_WIDGET_INITIAL_DATA', payload: { path: 'firstName', data: 'default' } },
      ]);

      expect(state.data['firstName']).toBe('default');
    });

    it('BASELINE (flips in step 05: cleared stays cleared): re-defaults a path that exists with an explicit undefined', () => {
      const state = drive([
        init(makeBaseFormDef()),
        setData({ firstName: undefined }),
        { type: 'SET_WIDGET_INITIAL_DATA', payload: { path: 'firstName', data: 'default' } },
      ]);

      expect('firstName' in state.data).toBe(true);
      expect(state.data['firstName']).toBe('default');
    });

    it('leaves an existing value alone', () => {
      const state = drive([
        init(makeBaseFormDef()),
        setData({ firstName: 'Joan' }),
        { type: 'SET_WIDGET_INITIAL_DATA', payload: { path: 'firstName', data: 'default' } },
      ]);

      expect(state.data['firstName']).toBe('Joan');
    });

    it('never marks the defaulted field touched', () => {
      const state = drive([
        init(makeBaseFormDef()),
        setData({}),
        { type: 'SET_WIDGET_INITIAL_DATA', payload: { path: 'firstName', data: 'default' } },
      ]);

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

    // REFACTOR-NOTE: the row widget has to be mounted for its props to be computed at all.
    it('resolves an interpolated row prop per row once the row is mounted', () => {
      const initialized = drive([init(makeRowScopeFormDef())]);
      const rowTotal = templateChild(initialized, 'lineItems', 'rowTotal');

      const state = drive([
        init(makeRowScopeFormDef()),
        setData(rowScopeData),
        mountRow(rowTotal, [0]),
        mountRow(rowTotal, [1]),
      ]);

      expect(propsOf(state, 'rowTotal[0]')['text']).toBe('Row 1: 2');
      expect(propsOf(state, 'rowTotal[1]')['text']).toBe('Row 2: 5');
    });

    it('recomputes row props and flags when the row data changes', () => {
      const initialized = drive([init(makeRowScopeFormDef())]);
      const rowTotal = templateChild(initialized, 'lineItems', 'rowTotal');

      const state = drive([
        init(makeRowScopeFormDef()),
        setData(rowScopeData),
        mountRow(rowTotal, [0]),
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
      const initialized = drive([init(makeHostFunctionsFormDef())]);

      const adult = drive([
        init(makeHostFunctionsFormDef()),
        addWidget(initialized.flatForm['doubled']),
        setData({ age: 21, count: 4 }),
      ]);

      expect(adult.currentStates).toEqual(['adult']);
      expect(adult.widgetFlags['adultsOnly']).toEqual({ hidden: false });
      expect(propsOf(adult, 'doubled')['text']).toBe('Double: 8');

      const minor = drive([
        init(makeHostFunctionsFormDef()),
        addWidget(initialized.flatForm['doubled']),
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
    // REFACTOR-NOTE: exercises the inline function-widget block in `reducer.ts` (ATTEMPT_VALIDATION),
    // which survives until step 12.
    it('recomputes the mounted row function widget with touched, errors and $item / $index in scope', () => {
      const rowName = makeRowNameFunctionWidget();
      const formDef = {
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
                children: [rowName],
              },
            },
          },
        ],
      };

      const mounted = drive([
        init(formDef),
        setData({ users: [{ name: 'Ada' }, { name: 'Linus' }] }),
        mountRow(rowName, [1]),
      ]);

      // On mount the regular pipeline stamps the materialized uid back onto the computed widget.
      expect(mounted.calculatedWidgets['rowName[1]'].current.uid).toBe('rowName[1]');

      const reduce = makeReducer();
      const state = reduce(mounted, {
        type: 'ATTEMPT_VALIDATION',
        payload: { reason: 'blur', path: 'users.1.name', uid: 'rowName[1]' },
      });

      const current = state.calculatedWidgets['rowName[1]'].current as InputWidget<any, string>;

      // The row is recomputed with the blur outcome and its own item in scope.
      expect(current.props?.['seenTouched']).toBe(true);
      expect(current.props?.['seenItemName']).toBe('Linus');
      expect(current.props?.['seenIndex']).toBe(1);

      expect(state.touched).toBe(true);
      expect(state.touchedControls['users.1.name']).toBe(true);

      // REFACTOR-NOTE: the inline block writes the raw function result straight into
      // calculatedWidgets, so unlike the regular pipeline it does not stamp the materialized uid
      // back on. The map key stays `rowName[1]` while the widget claims to be `rowName`.
      expect(current.uid).toBe('rowName');

      // REFACTOR-NOTE: a row function widget is validated under the TEMPLATE path, because
      // `current.path` comes from what the function returned and is never materialized, while
      // touchedControls and the blur payload use the row path. The two never meet, so the row
      // never receives its own errors.
      // FINDING: step 05 flips this on purpose. The derive stamps `current.path` from
      // `source.path`, so the row is validated under `users.1.name` and gets its own errors.
      expect(state.validations).toEqual({ 'users.items.name': ['required'] });
      expect(state.validations['users.1.name']).toBeUndefined();
      expect(current.props?.['seenErrors']).toBeUndefined();
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
      const initialized = drive([init(makeBaseFormDef())]);

      const state = drive([
        init(makeBaseFormDef()),
        setData({}),
        addWidget(initialized.flatForm['firstName']),
        override(),
      ]);

      expect(state.widgetPropOverrides['firstName']).toEqual({ placeholder: 'Your name' });
      expect(propsOf(state, 'firstName')['placeholder']).toBe('Your name');
      expect(state.validations).toEqual({});
    });

    it('re-runs validation when it targets a touched input on a touched form', () => {
      const initialized = drive([init(makeBaseFormDef())]);

      const blurred = drive([
        init(makeBaseFormDef()),
        setData({}),
        addWidget(initialized.flatForm['firstName']),
        {
          type: 'ATTEMPT_VALIDATION',
          payload: { reason: 'blur', path: 'firstName', uid: 'firstName' },
        },
        // A plain data write does NOT re-validate, so the failure below is stale on purpose.
        { type: 'SET_WIDGET_DATA', payload: { path: 'firstName', data: 'Joan' } },
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
    it('updates injectedValidations and runs no recompute pipeline', () => {
      const initialized = drive([init(makeBaseFormDef())]);

      const before = drive([
        init(makeBaseFormDef()),
        setData({ firstName: 'Joan', users: [{}] }),
        addWidget(initialized.flatForm['firstName']),
      ]);

      const reduce = makeReducer();
      const after = reduce(before, {
        type: 'INJECT_VALIDATION_ISSUES',
        payload: { path: 'firstName', issues: ['taken'] },
      });

      expect(after.injectedValidations['firstName']).toEqual(['taken']);

      // No stage of the pipeline ran, so every derived map keeps its identity.
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

    // Landed in #265 (`214b7f28`), after this spec was first written. The issues have to be
    // visible right away, and an untouched control shows nothing.
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
      const initialized = drive([init(makeBaseFormDef())]);

      const state = drive([
        init(makeBaseFormDef()),
        setData({}),
        addWidget(initialized.flatForm['firstName']),
        {
          type: 'ATTEMPT_VALIDATION',
          payload: { reason: 'blur', path: 'firstName', uid: 'firstName' },
        },
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
      const initialized = drive([init(makePositionUidFormDef())]);

      // Inputs are keyed `<path>-<type>` by the decoder; everything else gets a position uid.
      expect(initialized.flatForm).toHaveProperty('#0.0');
      expect(initialized.flatForm).toHaveProperty('rows-repeater');

      const rowLabel = templateChild(initialized, 'rows-repeater', '#0.1.t.0');
      const rowBadge = templateChild(initialized, 'rows-repeater', '#0.1.t.1');
      expect(rowLabel).toBeDefined();
      expect(rowBadge).toBeDefined();

      const state = drive([
        init(makePositionUidFormDef()),
        setData({ rows: [{}, {}] }),
        mountRow(rowLabel, [0]),
        mountRow(rowLabel, [1]),
      ]);

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
    it('drops a mounted widget from calculatedWidgets as soon as it becomes hidden', () => {
      const initialized = drive([init(makeBaseFormDef())]);

      const visible = drive([
        init(makeBaseFormDef()),
        setData({ age: 21 }),
        addWidget(initialized.flatForm['bio']),
      ]);
      expect(Object.keys(visible.calculatedWidgets)).toEqual(['bio']);

      const reduce = makeReducer();
      const hidden = reduce(visible, setData({ age: 10 }));

      expect(hidden.widgetFlags['bio']).toEqual({ hidden: true });
      expect(hidden.calculatedWidgets).not.toHaveProperty('bio');

      // BASELINE (flips in step 05): the props stage iterates the registry, so a widget it drops
      // can never re-enter it. Only a re-mount brings it back, which is exactly what the
      // renderers do today.
      const visibleAgain = reduce(hidden, setData({ age: 30 }));
      expect(visibleAgain.widgetFlags['bio']).toEqual({ hidden: false });
      expect(visibleAgain.calculatedWidgets).not.toHaveProperty('bio');
    });

    it('never validates a hidden input, even when it is required and empty', () => {
      const initialized = drive([init(makeGatedInputFormDef())]);

      const mounted = drive([
        init(makeGatedInputFormDef()),
        setData({ age: 10 }),
        addWidget(initialized.flatForm['secret']),
      ]);

      // Mounted, but hidden: it never reaches calculatedWidgets, which is what validateAll reads.
      expect(mounted.widgetFlags['secret']).toEqual({ hidden: true });
      expect(mounted.calculatedWidgets).toEqual({});

      const reduce = makeReducer();
      const validated = reduce(mounted, { type: 'VALIDATE_ALL' });

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
    it('touches and validates every mounted input, and recomputes isFormValid', () => {
      const initialized = drive([init(makeBaseFormDef())]);

      const mounted = drive([
        init(makeBaseFormDef()),
        setData({ age: 21 }),
        addWidget(initialized.flatForm['firstName']),
        addWidget(initialized.flatForm['bio']),
      ]);

      const reduce = makeReducer();
      const state = reduce(mounted, { type: 'VALIDATE_ALL' });

      expect(state.touched).toBe(true);
      expect(state.validations).toEqual({ firstName: ['required'] });
      expect(state.isFormValid).toBe(false);

      // BASELINE (flips in step 05): the touched set is rebuilt from the MOUNTED inputs, so an
      // input whose component has not mounted is neither touched nor validated by a submit.
      expect(state.touchedControls).toEqual({ firstName: true });
    });

    it('replaces the touched set instead of merging into it', () => {
      const initialized = drive([init(makeBaseFormDef())]);

      const blurred = drive([
        init(makeBaseFormDef()),
        setData({}),
        addWidget(initialized.flatForm['firstName']),
        // A blur can touch any path, including one no mounted widget owns.
        {
          type: 'ATTEMPT_VALIDATION',
          payload: { reason: 'blur', path: 'ghost', uid: 'firstName' },
        },
      ]);
      expect(blurred.touchedControls).toEqual({ ghost: true });

      const reduce = makeReducer();
      const state = reduce(blurred, { type: 'VALIDATE_ALL' });

      // BASELINE (flips in step 05): everything not owned by a mounted input is dropped.
      expect(state.touchedControls).toEqual({ firstName: true });
    });
  });

  // ---------------------------------------------------------------------------
  // 12. Validation-driven expressions
  // ---------------------------------------------------------------------------

  describe('validation-driven expressions', () => {
    it('feeds $errors and $formIsInvalid into states, flags and props', () => {
      const initialized = drive([init(makeValidationDrivenFormDef())]);

      const mounted = drive([
        init(makeValidationDrivenFormDef()),
        setData({}),
        addWidget(initialized.flatForm['firstName']),
        addWidget(initialized.flatForm['submit']),
      ]);

      expect(mounted.currentStates).toEqual([]);
      expect(mounted.widgetFlags['nameHint']).toEqual({ hidden: true });
      expect(mounted.widgetFlags['submit']).toEqual({ disabled: false });

      const reduce = makeReducer();
      const blurred = reduce(mounted, {
        type: 'ATTEMPT_VALIDATION',
        payload: { reason: 'blur', path: 'firstName', uid: 'firstName' },
      });

      expect(blurred.validations).toEqual({ firstName: ['required'] });
      expect(blurred.currentStates).toEqual(['broken']);
      expect(blurred.widgetFlags['nameHint']).toEqual({ hidden: false });
      expect(blurred.widgetFlags['submit']).toEqual({ disabled: true });
      // The `disabled: { when }` field of a mounted widget mirrors its flag.
      const submit = blurred.calculatedWidgets['submit'].current as ActionWidget<string>;
      expect(submit.disabled).toBe(true);
      expect(blurred.isFormValid).toBe(false);
    });

    it('does not validate on a data change: the errors stay until the next trigger', () => {
      const initialized = drive([init(makeValidationDrivenFormDef())]);

      const blurred = drive([
        init(makeValidationDrivenFormDef()),
        setData({}),
        addWidget(initialized.flatForm['firstName']),
        addWidget(initialized.flatForm['submit']),
        {
          type: 'ATTEMPT_VALIDATION',
          payload: { reason: 'blur', path: 'firstName', uid: 'firstName' },
        },
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

    it('counts injected issues in isFormValid but not in $errors / $formIsInvalid', () => {
      const initialized = drive([init(makeValidationDrivenFormDef())]);

      const injected = drive([
        init(makeValidationDrivenFormDef()),
        setData({ firstName: 'Joan' }),
        addWidget(initialized.flatForm['firstName']),
        addWidget(initialized.flatForm['submit']),
        { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'firstName', issues: ['taken'] } },
      ]);

      // Injecting alone recomputes nothing, isFormValid included.
      expect(injected.isFormValid).toBe(true);

      const reduce = makeReducer();
      const state = reduce(injected, { type: 'VALIDATE_ALL' });

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
    it('reports an errored form when a prop interpolation throws, and computes nothing', () => {
      const initialized = drive([init(makeBrokenInterpolationFormDef())]);

      const state = drive([
        init(makeBrokenInterpolationFormDef()),
        setData({ age: 21 }),
        addWidget(initialized.flatForm['oops']),
      ]);

      expect(state.formHealth).toEqual({
        status: 'errored',
        message:
          "[40] Failed to evaluate '{{$form.missing.deep}}': Cannot read properties of undefined (reading 'deep')",
        code: 40,
      });

      // The props stage threw before writing anything, so the widget stays as ADD_WIDGET
      // registered it: known, but never computed.
      expect(state.calculatedWidgets['oops'].current).toEqual({});
    });

    it('BASELINE (flips in step 05: the derive self-heals): stays errored after the data is fixed', () => {
      const initialized = drive([init(makeBrokenInterpolationFormDef())]);

      const errored = drive([
        init(makeBrokenInterpolationFormDef()),
        setData({ age: 21 }),
        addWidget(initialized.flatForm['oops']),
      ]);
      expect(errored.currentStates).toEqual(['adult']);

      const reduce = makeReducer();
      const state = reduce(errored, setData({ age: 10, missing: { deep: 'there' } }));

      // The props stage succeeds and writes the fixed text...
      expect(propsOf(state, 'oops')['text']).toBe('Hi there');
      // ...but nothing clears formHealth, so the form stays errored for good.
      expect(state.formHealth.status).toBe('errored');
      // And calculateCurrentState bails out while errored, so the states are frozen at the
      // values they had when the form broke.
      expect(state.currentStates).toEqual(['adult']);
    });

    it('skips the whole pipeline for a widget that mounts while the form is errored', () => {
      const initialized = drive([init(makeBrokenInterpolationFormDef())]);

      const errored = drive([
        init(makeBrokenInterpolationFormDef()),
        setData({}),
        addWidget(initialized.flatForm['oops']),
      ]);

      const reduce = makeReducer();
      const state = reduce(errored, addWidget(initialized.flatForm['fine']));

      // REFACTOR-NOTE: the ADD_WIDGET pipeline is the only one gated on form health, so the
      // widget is registered but left uncomputed until something clears the error.
      expect(state.calculatedWidgets['fine'].current).toEqual({});
      expect(state.formHealth.status).toBe('errored');
    });

    it('SET_FORM_HEALTH sets the status without running any stage', () => {
      const initialized = drive([init(makeBrokenInterpolationFormDef())]);

      const errored = drive([
        init(makeBrokenInterpolationFormDef()),
        setData({}),
        addWidget(initialized.flatForm['oops']),
      ]);

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
  // 14. Repeater rows that outlive their data
  // ---------------------------------------------------------------------------

  describe('repeater rows that outlive their data', () => {
    // REFACTOR-NOTE: a row keeps its calculatedWidgets entry until its component unmounts, which
    // happens after the data is already gone. Step 05 derives the registry from the data, so this
    // window (and the guard that covers it) disappears.
    it('keeps the last computation of a row whose item no longer exists', () => {
      const initialized = drive([init(makeRowScopeFormDef())]);
      const rowTotal = templateChild(initialized, 'lineItems', 'rowTotal');

      const twoRows = drive([
        init(makeRowScopeFormDef()),
        setData(rowScopeData),
        mountRow(rowTotal, [0]),
        mountRow(rowTotal, [1]),
      ]);
      expect(propsOf(twoRows, 'rowTotal[1]')['text']).toBe('Row 2: 5');

      const reduce = makeReducer();
      const oneRow = reduce(twoRows, setData({ lineItems: [{ quantity: 9, active: true }] }));

      // The scopes and the resolved sources are rebuilt from the data, so row 1 is gone from
      // both.
      expect(Object.keys(oneRow.repeaterItemScopes).filter((uid) => uid.includes('[1]'))).toEqual(
        [],
      );
      expect(oneRow.resolvedSources).not.toHaveProperty('rowTotal[1]');

      // The surviving row is recomputed against the new data.
      expect(propsOf(oneRow, 'rowTotal[0]')['text']).toBe('Row 1: 9');

      // The orphaned row is not recomputed against missing data: its previous entry is carried
      // over untouched, reference included.
      expect(propsOf(oneRow, 'rowTotal[1]')['text']).toBe('Row 2: 5');
      expect(oneRow.calculatedWidgets['rowTotal[1]']).toBe(
        twoRows.calculatedWidgets['rowTotal[1]'],
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 15. Layout children
  // ---------------------------------------------------------------------------

  describe('layout children', () => {
    it('reports only the visible children of a mounted layout', () => {
      const initialized = drive([init(makeLayoutFormDef())]);

      const minor = drive([
        init(makeLayoutFormDef()),
        setData({ age: 10 }),
        addWidget(initialized.flatForm['card']),
      ]);
      expect(childUidsOf(minor, 'card')).toEqual(['firstName']);

      const adult = drive([
        init(makeLayoutFormDef()),
        setData({ age: 21 }),
        addWidget(initialized.flatForm['card']),
      ]);
      expect(childUidsOf(adult, 'card')).toEqual(['firstName', 'bio']);
    });

    it('filters a row layout by the row flags but leaves the child uids unstamped', () => {
      const initialized = drive([init(makeRowScopeFormDef())]);
      const template = repeaterTemplate(initialized, 'lineItems');

      const state = drive([
        init(makeRowScopeFormDef()),
        setData(rowScopeData),
        mountRow(template, [0]),
        mountRow(template, [1]),
      ]);

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

    it('resolves an interpolated prop of a mounted inner row', () => {
      const initialized = drive([init(makeNestedRepeaterFormDef())]);
      const innerRepeater = templateChild(initialized, 'teams', 'devs') as InputWidget<any, string>;
      const devLabel = (innerRepeater.props as { template: LayoutWidget<string> }).template
        .children[1];

      const state = drive([
        init(makeNestedRepeaterFormDef()),
        setData(nestedRepeaterData),
        mountRow(devLabel, [0, 1]),
        mountRow(devLabel, [1, 0]),
      ]);

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
      const initialized = drive([init(makeMetaFormDef())]);

      const dev = drive([
        init(makeMetaFormDef()),
        addWidget(initialized.flatForm['banner']),
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

    it('SET_LANGUAGE recomputes props only, leaving every other derived map untouched', () => {
      const initialized = drive([init(makeBaseFormDef())]);

      const before = drive([
        init(makeBaseFormDef()),
        setData({ age: 21, users: [{ name: 'Ada' }] }),
        addWidget(initialized.flatForm['firstName']),
      ]);

      const reduce = makeReducer();
      const after = reduce(before, { type: 'SET_LANGUAGE', payload: { lang: 'fr-FR' } });

      expect(after.lang).toBe('fr-FR');
      expect(after.currentStates).toBe(before.currentStates);
      expect(after.widgetFlags).toBe(before.widgetFlags);
      expect(after.resolvedSources).toBe(before.resolvedSources);
      expect(after.repeaterItemScopes).toBe(before.repeaterItemScopes);
      // Nothing a prop depends on changed, so the widget entry keeps its reference.
      expect(after.calculatedWidgets['firstName']).toBe(before.calculatedWidgets['firstName']);
    });

    it('SET_LANGUAGE does run the props stage', () => {
      const initialized = drive([init(makeHostFunctionsFormDef())]);

      const before = drive([
        init(makeHostFunctionsFormDef()),
        addWidget(initialized.flatForm['doubled']),
        setData({ count: 4 }),
      ]);
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
      const initialized = drive([init(makeBaseFormDef())]);

      const mounted = drive(
        [init(makeBaseFormDef()), setData({}), addWidget(initialized.flatForm['firstName'])],
        'blur',
      );

      const reduce = makeReducer('blur');
      const onChange = reduce(mounted, {
        type: 'ATTEMPT_VALIDATION',
        payload: { reason: 'change', path: 'firstName', uid: 'firstName' },
      });

      // Not merely equivalent: the reducer returns the very same state.
      expect(onChange).toBe(mounted);

      const onBlur = reduce(mounted, {
        type: 'ATTEMPT_VALIDATION',
        payload: { reason: 'blur', path: 'firstName', uid: 'firstName' },
      });

      expect(onBlur.touched).toBe(true);
      expect(onBlur.validations).toEqual({ firstName: ['required'] });
    });

    it('INITIALIZE starts over: data and every derived map are reset', () => {
      const initialized = drive([init(makeBaseFormDef())]);

      const state = drive([
        init(makeBaseFormDef()),
        setData({ age: 21, firstName: 'Joan', users: [{ name: 'Ada' }] }),
        addWidget(initialized.flatForm['firstName']),
        { type: 'VALIDATE_ALL' },
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
  // 18. Mount and unmount side effects
  // ---------------------------------------------------------------------------

  describe('mount and unmount side effects', () => {
    // REFACTOR-NOTE: both mechanics below exist only because the registry is mount-driven.
    // Step 12 deletes the actions that carry them.
    it('ADD_WIDGET touches the input it registers when the form is already touched', () => {
      const initialized = drive([init(makeBaseFormDef())]);

      const touchedForm = drive([
        init(makeBaseFormDef()),
        setData({}),
        addWidget(initialized.flatForm['bio']),
        { type: 'VALIDATE_ALL' },
      ]);
      expect(touchedForm.touched).toBe(true);
      expect(touchedForm.touchedControls).toEqual({});

      const reduce = makeReducer();
      const state = reduce(touchedForm, addWidget(initialized.flatForm['firstName']));

      // A widget that mounts into an already-submitted form shows its errors right away.
      expect(state.touchedControls).toEqual({ firstName: true });
    });

    // Landed in #263 (`88c51949`), after this spec was first written. The gate is
    // `allControlsValidated` (a VALIDATE_ALL pass ran), not `touched` (any blur happened).
    // The shared Cypress describe "Error visibility of inputs revealed after form interaction"
    // in `libs/ui-testing/src/lib/core-features/include-exclude.cy.ts` covers the same rule.
    // Survives the flip: step 05 keeps the rule and only changes the trigger from ADD_WIDGET to
    // the input appearing in a derive.
    it('ADD_WIDGET does not touch the input it registers when only a blur elsewhere happened', () => {
      const initialized = drive([init(makeGatedInputWithSiblingFormDef())]);

      const blurredElsewhere = drive([
        init(makeGatedInputWithSiblingFormDef()),
        setData({ age: 10 }),
        addWidget(initialized.flatForm['nickname']),
        {
          type: 'ATTEMPT_VALIDATION',
          payload: { reason: 'blur', path: 'nickname', uid: 'nickname' },
        },
      ]);
      expect(blurredElsewhere.touched).toBe(true);
      expect(blurredElsewhere.allControlsValidated).toBe(false);

      const reduce = makeReducer();
      const state = reduce(
        { ...blurredElsewhere, data: { age: 21 } },
        addWidget(initialized.flatForm['secret']),
      );

      // The input is now visible and empty, but nothing submitted yet, so it stays untouched and
      // shows no error.
      expect(state.widgetFlags['secret']).toEqual({ hidden: false });
      expect(state.touchedControls).toEqual({ nickname: true });
      expect(state.validations['secret']).toBeUndefined();
    });

    it('ADD_WIDGET touches AND validates a required input registered after VALIDATE_ALL', () => {
      const initialized = drive([init(makeGatedInputFormDef())]);

      const validated = drive([
        init(makeGatedInputFormDef()),
        setData({ age: 10 }),
        { type: 'VALIDATE_ALL' },
      ]);
      expect(validated.allControlsValidated).toBe(true);
      expect(validated.isFormValid).toBe(true);

      const reduce = makeReducer();
      const state = reduce(
        { ...validated, data: { age: 21 } },
        addWidget(initialized.flatForm['secret']),
      );

      // Touched, validated and counted against the form, all in the same dispatch.
      expect(state.touchedControls).toEqual({ secret: true });
      expect(state.validations['secret']).toEqual(['required']);
      expect(state.isFormValid).toBe(false);
    });

    it('REMOVE_WIDGET clears the touched flag and the overrides but leaves the validation behind', () => {
      const initialized = drive([init(makeBaseFormDef())]);

      const mounted = drive([
        init(makeBaseFormDef()),
        setData({}),
        addWidget(initialized.flatForm['firstName']),
        { type: 'VALIDATE_ALL' },
        {
          type: 'OVERRIDE_WIDGET_PROP',
          payload: { uid: 'firstName', prop: 'placeholder', value: 'Your name' },
        },
      ]);
      expect(mounted.touchedControls).toEqual({ firstName: true });
      expect(mounted.validations).toEqual({ firstName: ['required'] });

      const reduce = makeReducer();
      const state = reduce(mounted, { type: 'REMOVE_WIDGET', payload: { uid: 'firstName' } });

      expect(state.touchedControls).toEqual({});
      expect(state.widgetPropOverrides).toEqual({});
      // Nothing re-runs the validators on unmount, so the entry of a widget that is no longer
      // there keeps counting against the form.
      expect(state.validations).toEqual({ firstName: ['required'] });
    });
  });

  // ---------------------------------------------------------------------------
  // 19. Actions that address a widget the registry does not hold
  // ---------------------------------------------------------------------------

  describe('actions that address a widget the registry does not hold', () => {
    // FINDING: both actions carry a uid and both read `calculatedWidgets[uid]` without checking
    // it is there, so they throw instead of doing nothing. Reachable today for any widget that is
    // hidden or not mounted yet: OVERRIDE_WIDGET_PROP is a public API called from event handlers,
    // and ATTEMPT_VALIDATION rides on DOM events that can outlive a mount.
    // These pins record the crash, they do not endorse it.
    it('OVERRIDE_WIDGET_PROP throws on a uid that is not registered', () => {
      const initialized = drive([init(makeBaseFormDef())]);

      const mounted = drive([
        init(makeBaseFormDef()),
        setData({}),
        addWidget(initialized.flatForm['firstName']),
      ]);

      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const reduce = makeReducer();

      expect(() =>
        reduce(mounted, {
          type: 'OVERRIDE_WIDGET_PROP',
          payload: { uid: 'bio', prop: 'text', value: 'hello' },
        }),
      ).toThrow(TypeError);

      // The override reducer itself does handle it: it warns and returns the state unchanged.
      // The re-validation gate that runs after it is what throws.
      expect(warn).toHaveBeenCalledWith('Widget with uid "bio" not found');
      warn.mockRestore();
    });

    it('ATTEMPT_VALIDATION throws on a uid that is not registered', () => {
      const initialized = drive([init(makeBaseFormDef())]);

      const mounted = drive([
        init(makeBaseFormDef()),
        setData({}),
        addWidget(initialized.flatForm['firstName']),
      ]);

      const reduce = makeReducer();

      expect(() =>
        reduce(mounted, {
          type: 'ATTEMPT_VALIDATION',
          payload: { reason: 'blur', path: 'firstName', uid: 'bio' },
        }),
      ).toThrow(TypeError);
    });
  });
});
