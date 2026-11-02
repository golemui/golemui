import { type StandardSchemaV1 } from '@standard-schema/spec';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorCodes } from '../errors';
import { type ValidatorFn } from '../form-validator';
import {
  type ActionWidget,
  type DisplayWidget,
  type FunctionWidget,
  type InputWidget,
  type LayoutWidget,
  type NonFunctionWidget,
} from '../form-widget';
import { identityTranslator } from '../i18n';
import { type ExpressionFunctions, type ValidateOn } from '../shared';
import {
  EXPRESSION_LIMITS,
  type ExpressionPolicy,
  measureExpression,
} from '../utils/check-expression';
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

const makeReducer = (
  validateOn: ValidateOn = 'eager',
  formValidators: ValidatorFn<any> = validators as ValidatorFn<any>,
) =>
  reducer({
    validators: formValidators,
    validateOn,
    localization: identityTranslator('en-US'),
    functions,
  });

/** Dispatches a sequence of actions from a fresh initial state and returns the final state. */
const drive = (
  actions: Action[],
  validateOn: ValidateOn = 'eager',
  formValidators?: ValidatorFn<any>,
): State => {
  const reduce = makeReducer(validateOn, formValidators);
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

const overrideByPath = (path: string, value: unknown): Action => ({
  type: 'OVERRIDE_WIDGET_PROP',
  payload: { path, prop: 'placeholder', value },
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
// Each fixture is a factory, so every test starts from its own object and no test can be
// affected by what a previous one did to a shared one.
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

/** The same echoing function widget, at the top level of the form. */
const makeTopLevelFunctionWidget = (): FunctionWidget<string> => {
  const firstName: FunctionWidget<string> = (api) =>
    ({
      uid: 'firstName',
      kind: 'input',
      type: 'textinput',
      path: 'firstName',
      validator: { required: true },
      props: {
        seenErrors: api?.errors,
        seenTouched: api?.touched,
        seenTranslate: typeof api?.translate,
      },
    }) as InputWidget<any, string>;
  firstName.uid = 'firstName';
  return firstName;
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
 * A repeater whose row function widget returns ONE cached object for every row, which is what a
 * memoizing widget author writes.
 */
const makeCachedRowWidgetFormDef = () => {
  const cached = {
    uid: 'cachedRow',
    kind: 'input',
    type: 'textinput',
    path: 'users.items.name',
    props: { label: 'Name' },
  } as unknown as InputWidget<any, string>;
  const rowName: FunctionWidget<string> = () => cached;
  rowName.uid = 'rowName';
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
  return { cached, formDef };
};

/** A function widget at the top level and another inside a repeater row, both required. */
const makeFunctionWidgetsFormDef = () => ({
  form: [
    makeTopLevelFunctionWidget(),
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
 * A repeater bound to a property named `items`, with a required row field and a row field whose
 * name starts with `items`. The second field is visible only for priced rows. Each row also has
 * its own `items` array, and two notes read `items` segments that are not the row token.
 */
const makeItemsPropertyFormDef = () => ({
  form: [
    {
      uid: 'lines',
      kind: 'input',
      type: 'repeater',
      path: 'invoice.items',
      props: {
        template: {
          uid: 'linesRow',
          kind: 'layout',
          type: 'flex',
          children: [
            {
              uid: 'name',
              kind: 'input',
              type: 'textinput',
              path: 'invoice.items.items.name',
              validator: { required: true },
            },
            {
              uid: 'itemsTotal',
              kind: 'input',
              type: 'number',
              path: 'invoice.items.items.itemsTotal',
              include: { when: '$item.priced === true' },
            },
            {
              uid: 'pricedNote',
              kind: 'display',
              type: 'markdownText',
              include: { when: '$form.invoice.items.items.priced === true' },
            },
            {
              uid: 'partsNote',
              kind: 'display',
              type: 'markdownText',
              include: { when: '$item.items.length > 0' },
            },
          ],
        },
      },
    },
  ],
});

const itemsPropertyData = {
  invoice: {
    items: [
      { name: 'Pen', priced: true, itemsTotal: 3, items: ['cap'] },
      { priced: false, itemsTotal: 9, items: [] },
    ],
  },
};

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

/** The same gated required input, produced by a function widget instead of a JSON object. */
const makeGatedFunctionWidgetFormDef = () => {
  const secret: FunctionWidget<string> = () =>
    ({
      uid: 'secret',
      kind: 'input',
      type: 'textinput',
      path: 'secret',
      validator: { required: true },
      include: { in: ['adult'] },
    }) as InputWidget<any, string>;
  secret.uid = 'secret';
  return { states: { adult: '$form.age >= 18' }, form: [secret] };
};

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

/** A required input that a checkbox hides, and widgets that read the validation variables. */
const makeHiddenVatFormDef = () => ({
  states: { broken: '$formIsInvalid' },
  form: [
    { uid: 'isCompany', kind: 'input', type: 'checkbox', path: 'isCompany' },
    {
      uid: 'vatNumber',
      kind: 'input',
      type: 'textinput',
      path: 'vatNumber',
      validator: { required: true },
      include: { when: '$form.isCompany === true' },
    },
    { uid: 'vatHint', kind: 'display', type: 'heading', include: { when: '!!$errors.vatNumber' } },
    { uid: 'status', kind: 'display', type: 'heading', props: { text: '{{$formIsInvalid}}' } },
    {
      uid: 'pay',
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

/**
 * A repeater whose row template interpolates a host function that does not exist. With no rows
 * the props pass has nothing to resolve, so the first derive succeeds and adding a row throws a
 * code 40 while the rows are being resolved.
 */
const makeBrokenRowPropFormDef = () => ({
  form: [
    { uid: 'title', kind: 'display', type: 'heading', props: { text: 'Users' } },
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
              uid: 'greeting',
              kind: 'display',
              type: 'heading',
              props: { text: 'Hi {{$fn.missing()}}' },
            },
            { uid: 'name', kind: 'input', type: 'textinput', path: 'users.items.name' },
          ],
        },
      },
    },
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
const makeNestedRepeaterFormDef = (extraDevRowChildren: Record<string, unknown>[] = []) => ({
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
                    ...extraDevRowChildren,
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

/** A row of plain values. The input binds the whole row, so row 1 has the path `<arrayPath>.1`. */
const plainRow = (uid: string, arrayPath: string) => ({
  uid: `${uid}Row`,
  kind: 'layout',
  type: 'flex',
  children: [
    {
      uid,
      kind: 'input',
      type: 'textinput',
      path: `${arrayPath}.items`,
      include: { when: "$item !== 'hidden'" },
    },
  ],
});

/** A repeater of plain values that hides each row whose value is `'hidden'`. */
const makePlainRowsFormDef = () => ({
  form: [
    {
      uid: 'tags',
      kind: 'input',
      type: 'repeater',
      path: 'tags',
      props: { template: plainRow('tag', 'tags') },
    },
  ],
});

/** A repeater of plain values inside the rows of a repeater of objects. */
const makeNestedPlainRowsFormDef = () => ({
  form: [
    {
      uid: 'groups',
      kind: 'input',
      type: 'repeater',
      path: 'groups',
      props: {
        template: {
          uid: 'groupRow',
          kind: 'layout',
          type: 'flex',
          children: [
            {
              uid: 'groupTags',
              kind: 'input',
              type: 'repeater',
              path: 'groups.items.tags',
              props: { template: plainRow('groupTag', 'groups.items.tags') },
            },
          ],
        },
      },
    },
  ],
});

/** A repeater whose rows are arrays of plain values. It hides the outer row at index 1. */
const makePlainMatrixFormDef = () => ({
  form: [
    {
      uid: 'matrix',
      kind: 'input',
      type: 'repeater',
      path: 'matrix',
      props: {
        template: {
          uid: 'matrixRow',
          kind: 'layout',
          type: 'flex',
          children: [
            {
              uid: 'cells',
              kind: 'input',
              type: 'repeater',
              path: 'matrix.items',
              include: { when: '$index !== 1' },
              props: { template: plainRow('cell', 'matrix.items') },
            },
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

    it('writes the default of an input whose path is a name that objects inherit', () => {
      const formDef = {
        form: [
          {
            uid: 'inherited',
            kind: 'input',
            type: 'textinput',
            path: 'toString',
            defaultValue: 'x',
          },
        ],
      };
      const state = drive([init(formDef), setData({})]);

      expect(Object.prototype.hasOwnProperty.call(state.data, 'toString')).toBe(true);
      expect(state.data['toString']).toBe('x');
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

    it('translates a row label config with the row in scope and leaves the template alone', () => {
      const reduce = reducer({
        validators: validators as ValidatorFn<any>,
        validateOn: 'eager',
        localization: {
          get lang() {
            return 'en-US';
          },
          translate: (key, params) => `${key}:${params?.['who']}`,
          subscribe: () => () => undefined,
        },
        functions,
      });
      const template = {
        uid: 'usersRow',
        kind: 'layout',
        type: 'flex',
        children: [
          {
            uid: 'name',
            kind: 'input',
            type: 'textinput',
            path: 'users.items.name',
            label: { key: 'row.name', params: { who: '$item.name' } },
          },
        ],
      };
      const formDef = {
        form: [
          { uid: 'users', kind: 'input', type: 'repeater', path: 'users', props: { template } },
        ],
      };
      const labelOf = (state: State, uid: string) =>
        (state.calculatedWidgets[uid].current as InputWidget<unknown, string>).label;

      const state = [
        init(formDef),
        setData({ users: [{ name: 'Ada' }, { name: 'Linus' }] }),
      ].reduce((current, action) => reduce(current, action), createInitialState('en-US'));

      expect(state.formHealth.status).toBe('ok');
      expect(labelOf(state, 'name[0]')).toBe('row.name:Ada');
      expect(labelOf(state, 'name[1]')).toBe('row.name:Linus');
      expect(propsOf(state, 'users')['template']).toEqual(template);
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

    it('rewrites both tokens of a nested row for every inner row', () => {
      const formDef = makeNestedRepeaterFormDef([
        {
          uid: 'badge',
          kind: 'display',
          type: 'heading',
          include: { when: '$form.teams.items.devs.items.active === true' },
        },
      ]);

      const state = drive([
        init(formDef),
        setData({
          teams: [
            { devs: [{ active: true }, { active: false }] },
            { devs: [{ active: false }, { active: true }] },
          ],
        }),
      ]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags['badge[0][0]']).toEqual({ hidden: false });
      expect(state.widgetFlags['badge[0][1]']).toEqual({ hidden: true });
      expect(state.widgetFlags['badge[1][0]']).toEqual({ hidden: true });
      expect(state.widgetFlags['badge[1][1]']).toEqual({ hidden: false });
    });

    // Only `when` expressions keep the old token. A row prop reads the row through `$item`.
    it('does not rewrite the token in a row prop, so the prop fails with code 40', () => {
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
                children: [
                  {
                    uid: 'title',
                    kind: 'display',
                    type: 'heading',
                    props: { text: 'Name: {{ $form.users.items.name }}' },
                  },
                ],
              },
            },
          },
        ],
      };
      const noRows = drive([init(formDef), setData({ users: [] })]);
      expect(noRows.formHealth).toEqual({ status: 'ok' });

      const reduce = makeReducer();
      const state = reduce(noRows, setData({ users: [{ name: 'Ada' }] }));

      expect(state.formHealth).toMatchObject({
        status: 'errored',
        code: 40,
        message: expect.stringContaining("'{{$form.users.items.name}}'"),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Function widgets after a blur
  // ---------------------------------------------------------------------------

  describe('function widgets after a blur', () => {
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

      // The blur changed what the widget sees, so it gets a new reference.
      expect(state.calculatedWidgets['rowName[1]']).not.toBe(
        initial.calculatedWidgets['rowName[1]'],
      );
    });

    it('re-resolves a top-level function widget with touched and errors in scope', () => {
      const initial = drive([
        init(makeFunctionWidgetsFormDef()),
        setData({ firstName: '', users: [{ name: 'Ada' }] }),
      ]);

      const reduce = makeReducer();
      const state = reduce(initial, blur('firstName', 'firstName'));

      const current = state.calculatedWidgets['firstName'].current as InputWidget<any, string>;

      expect(current.props?.['seenTouched']).toBe(true);
      expect(current.props?.['seenErrors']).toEqual(['required']);
      expect(current.props?.['seenTranslate']).toBe('function');
      expect(current.uid).toBe('firstName');
      expect(current.path).toBe('firstName');
      expect(state.validations['firstName']).toEqual(['required']);
      expect(state.touchedControls['firstName']).toBe(true);
    });

    it('keeps the calculated entry by reference when the same blur is dispatched twice', () => {
      const initial = drive([
        init(makeFunctionWidgetsFormDef()),
        setData({ firstName: '', users: [{ name: '' }] }),
      ]);

      const reduce = makeReducer();
      const first = reduce(initial, blur('firstName', 'firstName'));
      const second = reduce(first, blur('firstName', 'firstName'));

      expect(second.calculatedWidgets['firstName']).toBe(first.calculatedWidgets['firstName']);

      const rowFirst = reduce(second, blur('users.0.name', 'rowName[0]'));
      const rowSecond = reduce(rowFirst, blur('users.0.name', 'rowName[0]'));

      expect(rowSecond.calculatedWidgets['rowName[0]']).toBe(
        rowFirst.calculatedWidgets['rowName[0]'],
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

    it('prunes a hidden function widget control', () => {
      const state = drive([
        init(makeGatedFunctionWidgetFormDef()),
        setData({ age: 10, secret: 'shh' }),
      ]);

      expect(state.widgetFlags['secret']).toEqual({ hidden: true });
      expect(pruneHiddenData(state)).toEqual({ age: 10 });
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

      // The action computes isFormValid and runs no derive.
      expect(injected.isFormValid).toBe(false);
      expect(injected.widgetFlags['submit']).toEqual({ disabled: false });

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

  describe('injected issues and isFormValid', () => {
    const inject = (path: string, issues: string[] | null): Action => ({
      type: 'INJECT_VALIDATION_ISSUES',
      payload: { path, issues },
    });
    const validData = { firstName: 'Joan', users: [] };

    it('makes the form invalid at once and valid again when the issues are cleared', () => {
      const reduce = makeReducer();
      const initial = drive([init(makeBaseFormDef()), setData(validData)]);
      expect(initial.isFormValid).toBe(true);

      const injected = reduce(initial, inject('firstName', ['taken']));
      expect(injected.isFormValid).toBe(false);

      const cleared = reduce(injected, inject('firstName', null));
      expect(cleared.isFormValid).toBe(true);
    });

    it('stays invalid when one of two injected issues is cleared', () => {
      const state = drive([
        init(makeBaseFormDef()),
        setData({ firstName: 'Joan', users: [{}] }),
        inject('firstName', ['taken']),
        inject('users.0.name', ['taken']),
        inject('firstName', null),
      ]);

      expect(state.isFormValid).toBe(false);
    });

    it('stays invalid when the issues are cleared and a validator still fails', () => {
      const state = drive([
        init(makeBaseFormDef()),
        setData({}),
        blur('firstName', 'firstName'),
        inject('firstName', ['taken']),
        inject('firstName', null),
      ]);

      expect(state.validations['firstName']).toEqual(['required']);
      expect(state.isFormValid).toBe(false);
    });

    it('stays valid with an empty issues array', () => {
      const state = drive([init(makeBaseFormDef()), setData(validData), inject('firstName', [])]);

      expect(state.isFormValid).toBe(true);
    });

    it('stays valid with an issue on a path that no input owns', () => {
      const state = drive([init(makeBaseFormDef()), setData(validData), inject('ghost', ['bad'])]);

      expect(state.injectedValidations['ghost']).toEqual(['bad']);
      expect(state.isFormValid).toBe(true);
    });

    it('stays invalid after a failed validator when the issues are cleared', () => {
      const failingValidators: ValidatorFn<any> = () => {
        throw new Error('broken validator');
      };
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const state = drive(
        [
          init(makeBaseFormDef()),
          setData(validData),
          validateAllAction,
          inject('firstName', ['taken']),
          inject('firstName', null),
        ],
        'eager',
        failingValidators,
      );
      consoleError.mockRestore();

      expect(state.formHealth).toMatchObject({ code: errorCodes.validationError });
      expect(state.isFormValid).toBe(false);
    });
  });

  describe('hidden inputs and form validity', () => {
    const inject = (path: string, issues: string[] | null): Action => ({
      type: 'INJECT_VALIDATION_ISSUES',
      payload: { path, issues },
    });
    const vatBlur = blur('vatNumber', 'vatNumber');

    /** The VAT number input fails, then the checkbox is unchecked. */
    const hiddenAfterError = (): State =>
      drive([
        init(makeHiddenVatFormDef()),
        setData({ isCompany: true }),
        vatBlur,
        setWidgetData('isCompany', false),
      ]);

    it('uses the error of a visible input in states, flags and props', () => {
      const state = drive([init(makeHiddenVatFormDef()), setData({ isCompany: true }), vatBlur]);

      expect(state.currentStates).toEqual(['broken']);
      expect(state.widgetFlags['vatHint']).toEqual({ hidden: false });
      expect(state.widgetFlags['pay']).toEqual({ disabled: true });
      expect(propsOf(state, 'status')['text']).toBe('true');
      expect(state.isFormValid).toBe(false);
    });

    it('removes the error from states, flags and props at once when a data change hides the input', () => {
      const state = hiddenAfterError();

      expect(state.widgetFlags['vatNumber']).toEqual({ hidden: true });
      expect(state.currentStates).toEqual([]);
      expect(state.widgetFlags['vatHint']).toEqual({ hidden: true });
      expect(state.widgetFlags['pay']).toEqual({ disabled: false });
      expect(propsOf(state, 'status')['text']).toBe('false');
      expect(state.isFormValid).toBe(true);
    });

    it('counts the error again when the input is shown again', () => {
      const reduce = makeReducer();
      const state = reduce(hiddenAfterError(), setWidgetData('isCompany', true));

      expect(state.validations['vatNumber']).toEqual(['required']);
      expect(state.currentStates).toEqual(['broken']);
      expect(state.widgetFlags['vatHint']).toEqual({ hidden: false });
      expect(state.widgetFlags['pay']).toEqual({ disabled: true });
      expect(propsOf(state, 'status')['text']).toBe('true');
      expect(state.isFormValid).toBe(false);
    });

    it('ignores the old error of a hidden input when an injected issue is cleared', () => {
      const reduce = makeReducer();
      const injected = reduce(hiddenAfterError(), inject('isCompany', ['server error']));
      expect(injected.isFormValid).toBe(false);

      const cleared = reduce(injected, inject('isCompany', null));

      expect(cleared.validations['vatNumber']).toEqual(['required']);
      expect(cleared.isFormValid).toBe(true);
    });

    it('ignores an issue injected on a hidden input', () => {
      const state = drive([
        init(makeHiddenVatFormDef()),
        setData({ isCompany: false }),
        inject('vatNumber', ['rejected']),
      ]);

      expect(state.injectedValidations['vatNumber']).toEqual(['rejected']);
      expect(state.isFormValid).toBe(true);
    });

    it('ignores an injected issue at once when the input is hidden', () => {
      const reduce = makeReducer();
      const injected = drive([
        init(makeHiddenVatFormDef()),
        setData({ isCompany: true, vatNumber: 'ES123' }),
        inject('vatNumber', ['rejected']),
      ]);
      expect(injected.isFormValid).toBe(false);

      const hidden = reduce(injected, setWidgetData('isCompany', false));
      expect(hidden.isFormValid).toBe(true);

      expect(reduce(hidden, validateAllAction).isFormValid).toBe(true);
    });

    it('counts an injected issue again when the input is shown', () => {
      const reduce = makeReducer();
      const hidden = drive([
        init(makeHiddenVatFormDef()),
        setData({ isCompany: false, vatNumber: 'ES123' }),
        inject('vatNumber', ['rejected']),
      ]);
      expect(hidden.isFormValid).toBe(true);

      const shown = reduce(hidden, setWidgetData('isCompany', true));
      expect(shown.isFormValid).toBe(false);

      const state = reduce(shown, validateAllAction);
      expect(state.injectedValidations['vatNumber']).toEqual(['rejected']);
      expect(state.isFormValid).toBe(false);
    });

    it('counts the error when a visible input has the same path as a hidden input', () => {
      const failed = drive([
        init({
          form: [
            {
              uid: 'companyVat',
              kind: 'input',
              type: 'textinput',
              path: 'vatNumber',
              validator: { required: true },
              include: { when: '$form.isCompany === true' },
            },
            {
              uid: 'personVat',
              kind: 'input',
              type: 'textinput',
              path: 'vatNumber',
              validator: { required: true },
              exclude: { when: '$form.isCompany === true' },
            },
            {
              uid: 'status',
              kind: 'display',
              type: 'heading',
              props: { text: '{{$formIsInvalid}}' },
            },
          ],
        }),
        setData({ isCompany: true }),
        blur('vatNumber', 'companyVat'),
      ]);
      const reduce = makeReducer();
      const state = reduce(failed, setWidgetData('isCompany', false));

      expect(state.widgetFlags['companyVat']).toEqual({ hidden: true });
      expect(propsOf(state, 'status')['text']).toBe('true');
    });

    it('removes the errors of a row input when its row hides it', () => {
      const makeRowsFormDef = () => ({
        form: [
          {
            uid: 'rows',
            kind: 'input',
            type: 'repeater',
            path: 'rows',
            props: {
              template: {
                uid: 'row',
                kind: 'layout',
                type: 'flex',
                children: [
                  {
                    uid: 'name',
                    kind: 'input',
                    type: 'textinput',
                    path: 'rows.items.name',
                    validator: { required: true },
                    include: { when: '$item.active === true' },
                  },
                ],
              },
            },
          },
          {
            uid: 'status',
            kind: 'display',
            type: 'heading',
            props: { text: '{{$formIsInvalid}}' },
          },
        ],
      });
      const failed = drive([
        init(makeRowsFormDef()),
        setData({ rows: [{ active: true }] }),
        validateAllAction,
      ]);
      expect(failed.validations['rows.0.name']).toEqual(['required']);
      expect(propsOf(failed, 'status')['text']).toBe('true');

      const reduce = makeReducer();
      const state = reduce(failed, setData({ rows: [{ active: false }] }));

      expect(propsOf(state, 'status')['text']).toBe('false');
    });

    it('follows a chain of inputs that hide each other through $errors', () => {
      const failed = drive([
        init({
          form: [
            {
              uid: 'first',
              kind: 'input',
              type: 'textinput',
              path: 'first',
              validator: { required: true },
              include: { when: '$form.showFirst === true' },
            },
            {
              uid: 'second',
              kind: 'input',
              type: 'textinput',
              path: 'second',
              validator: { required: true },
              include: { when: '!!$errors.first' },
            },
            {
              uid: 'submit',
              kind: 'action',
              type: 'button',
              actionType: 'submit',
              disabled: { when: '$formIsInvalid' },
            },
          ],
        }),
        setData({ showFirst: true }),
        blur('first', 'first'),
        blur('second', 'second'),
      ]);
      expect(failed.validations).toEqual({ first: ['required'], second: ['required'] });
      expect(failed.widgetFlags['submit']).toEqual({ disabled: true });

      const reduce = makeReducer();
      const state = reduce(failed, setWidgetData('showFirst', false));

      expect(state.widgetFlags['first']).toEqual({ hidden: true });
      expect(state.widgetFlags['second']).toEqual({ hidden: true });
      expect(state.widgetFlags['submit']).toEqual({ disabled: false });
    });

    it('keeps the form healthy and the input stable when the error of the input hides it', () => {
      const failed = drive([
        init({
          form: [
            {
              uid: 'selfHiding',
              kind: 'input',
              type: 'textinput',
              path: 'selfHiding',
              validator: { required: true },
              include: { when: '!$formIsInvalid' },
            },
          ],
        }),
        setData({}),
        blur('selfHiding', 'selfHiding'),
      ]);
      expect(failed.validations['selfHiding']).toEqual(['required']);

      const reduce = makeReducer();
      const first = reduce(failed, setData({ other: 1 }));
      const second = reduce(first, setData({ other: 2 }));

      expect(first.formHealth).toEqual({ status: 'ok' });
      expect(second.widgetFlags['selfHiding']).toEqual(first.widgetFlags['selfHiding']);
      expect(first.widgetFlags['selfHiding']).toEqual(failed.widgetFlags['selfHiding']);
    });
  });

  // ---------------------------------------------------------------------------
  // 13. Form health
  // ---------------------------------------------------------------------------

  describe('form health', () => {
    it('reports an errored form when a prop interpolation throws, and publishes no widgets', () => {
      const state = drive([init(makeBrokenInterpolationFormDef()), setData({ age: 21 })]);

      expect(state.formHealth).toEqual({
        status: 'errored',
        message:
          "[40] Failed to evaluate '{{$form.missing.deep}}': Cannot read properties of undefined (reading 'deep')",
        code: 40,
      });

      // The failed derive publishes nothing, so this first one leaves the form with no widgets
      // and no states rather than with the placeholder entries the props pass was filling.
      expect(state.currentStates).toEqual([]);
      expect(state.calculatedWidgets).toEqual({});
      expect(state.data).toEqual({ age: 21 });
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

    it('reports code 12 when a prop function throws, and recovers when it returns', () => {
      const formDef = {
        form: [
          {
            uid: 'status',
            kind: 'display',
            type: 'heading',
            props: {
              text: ({ $form }: { $form: Record<string, any> }) => {
                if (!$form['ok']) {
                  throw new Error('not ok');
                }
                return 'fine';
              },
            },
          },
        ],
      };
      const errored = drive([init(formDef), setData({})]);
      expect(errored.formHealth).toEqual({
        status: 'errored',
        message: '[12] not ok',
        code: 12,
      });

      const reduce = makeReducer();
      const healed = reduce(errored, setData({ ok: true }));

      expect(healed.formHealth).toEqual({ status: 'ok' });
      expect(propsOf(healed, 'status')['text']).toBe('fine');
    });

    it('writes no default value in a derive that fails, and writes it in the next good derive', () => {
      const formDef = {
        form: [
          {
            uid: 'nickname',
            kind: 'input',
            type: 'textinput',
            path: 'nickname',
            defaultValue: 'x',
          },
          { uid: 'oops', kind: 'display', type: 'heading', props: { text: '{{ $form.a.b }}' } },
        ],
      };
      const errored = drive([init(formDef), setData({})]);

      expect(errored.formHealth).toMatchObject({ status: 'errored', code: 40 });
      expect(errored.data).toEqual({});

      const reduce = makeReducer();
      const healed = reduce(errored, setData({ a: { b: 1 } }));

      expect(healed.formHealth).toEqual({ status: 'ok' });
      expect(healed.data).toEqual({ a: { b: 1 }, nickname: 'x' });
    });

    it('renders no rows and stays ok for a repeater under a null parent', () => {
      const formDef = {
        form: [
          {
            uid: 'lines',
            kind: 'input',
            type: 'repeater',
            path: 'order.lines',
            props: {
              template: {
                uid: 'linesRow',
                kind: 'layout',
                type: 'flex',
                children: [
                  { uid: 'sku', kind: 'input', type: 'textinput', path: 'order.lines.items.sku' },
                ],
              },
            },
          },
        ],
      };
      const state = drive([init(formDef), setData({ order: null })]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(Object.keys(state.calculatedWidgets).filter((uid) => uid.startsWith('sku['))).toEqual(
        [],
      );

      // A primitive parent and a null row list act the same way.
      for (const data of [{ order: 5 }, { order: { lines: null } }]) {
        const other = drive([init(formDef), setData(data)]);
        expect(other.formHealth).toEqual({ status: 'ok' });
        expect(other.calculatedWidgets).not.toHaveProperty('sku[0]');
      }

      // Positive control: with an array the same form renders a row.
      const withRows = drive([init(formDef), setData({ order: { lines: [{ sku: 'a' }] } })]);
      expect(withRows.calculatedWidgets).toHaveProperty('sku[0]');
    });

    it('reports code 11 for a row input whose path is outside its repeater', () => {
      const formDef = {
        form: [
          {
            uid: 'rows',
            kind: 'input',
            type: 'repeater',
            path: 'rows',
            props: {
              template: {
                uid: 'rowsRow',
                kind: 'layout',
                type: 'flex',
                children: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'other.name' }],
              },
            },
          },
        ],
      };

      const state = drive([init(formDef), setData({ rows: [{}] })]);

      // The row expansion throws. The catch of the derive gives code 11 to every error that is
      // not a rejected expression, whichever pass threw it.
      expect(state.formHealth).toEqual({
        status: 'errored',
        code: 11,
        message: '[11] Path "other.name" is not inside the repeater row "rows.items".',
      });
    });

    it.each([
      {
        code: 21,
        formDef: {
          form: [
            { uid: 'name', kind: 'input', type: 'textinput', path: 'first' },
            { uid: 'name', kind: 'input', type: 'textinput', path: 'last' },
          ],
        },
      },
      { code: 22, formDef: { form: [{ uid: 'name', kind: 'unknown' }] } },
    ])(
      'keeps the decode error with code $code after SET_DATA and computes no widget',
      ({ code, formDef }) => {
        const initialized = drive([init(formDef)]);
        expect(initialized.formHealth).toMatchObject({ status: 'errored', code });

        const reduce = makeReducer();
        const state = reduce(initialized, setData({ first: 'Ada' }));

        expect(state.formHealth).toBe(initialized.formHealth);
        expect(state.data).toEqual({ first: 'Ada' });
        expect(state.calculatedWidgets).toEqual({});
      },
    );
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

    // A row is identified by its index. Its entries stay at that index when the data under it
    // changes, so they then belong to the value that moved there.
    it('keeps the entries of each index when two rows swap', () => {
      const before = drive([
        init(makeRequiredRowsFormDef()),
        setData({ users: [{ name: '' }, { name: 'B' }] }),
        blur('users.0.name', 'name[0]'),
        {
          type: 'OVERRIDE_WIDGET_PROP',
          payload: { uid: 'name[0]', prop: 'placeholder', value: 'First' },
        },
      ]);
      expect(before.validations['users.0.name']).toEqual(['required']);

      const reduce = makeReducer();
      const swapped = reduce(before, setData({ users: [{ name: 'B' }, { name: '' }] }));

      expect(swapped.touchedControls).toEqual({ 'users.0.name': true });
      // A data write does not validate again, so the error of index 0 now stands next to 'B'.
      expect(swapped.validations['users.0.name']).toEqual(['required']);
      expect(swapped.widgetPropOverrides).toEqual({ 'name[0]': { placeholder: 'First' } });
      expect(propsOf(swapped, 'name[0]')['placeholder']).toBe('First');
      expect(propsOf(swapped, 'name[1]')['placeholder']).toBeUndefined();
    });

    it('drops the entries of the last index when the first of three rows is removed', () => {
      const threeRows = drive([
        init(makeRequiredRowsFormDef()),
        setData({ users: [{ name: 'A' }, { name: '' }, { name: 'C' }] }),
        validateAllAction,
        {
          type: 'OVERRIDE_WIDGET_PROP',
          payload: { uid: 'name[0]', prop: 'placeholder', value: 'First' },
        },
        {
          type: 'OVERRIDE_WIDGET_PROP',
          payload: { uid: 'name[2]', prop: 'placeholder', value: 'Third' },
        },
      ]);
      expect(threeRows.validations).toEqual({
        users: null,
        'users.0.name': null,
        'users.1.name': ['required'],
        'users.2.name': null,
      });

      // Index 1 keeps its error, now next to 'C'. The override of index 0 now shows on the empty
      // row, and the override of index 2 is dropped.
      const reduce = makeReducer();
      const twoRows = reduce(threeRows, setData({ users: [{ name: '' }, { name: 'C' }] }));

      expect(twoRows.touchedControls).toEqual({
        users: true,
        'users.0.name': true,
        'users.1.name': true,
      });
      expect(twoRows.validations).toEqual({
        users: null,
        'users.0.name': null,
        'users.1.name': ['required'],
      });
      expect(twoRows.widgetPropOverrides).toEqual({ 'name[0]': { placeholder: 'First' } });
      expect(Object.keys(twoRows.calculatedWidgets).sort()).toEqual(
        ['#0', 'users', 'usersRow[0]', 'name[0]', 'usersRow[1]', 'name[1]'].sort(),
      );
    });
  });

  describe('repeater row changes', () => {
    const removeRow = (path: string, data: unknown, index: number): Action => ({
      type: 'SET_WIDGET_DATA',
      payload: { path, data, rowChange: { type: 'removed', index } },
    });

    /** Rows `[Alice, '']`: the second row is touched, has an error, an injected issue and an override. */
    const aliceAndEmptyBob = () =>
      drive([
        init(makeRequiredRowsFormDef()),
        setData({ users: [{ name: 'Alice' }, { name: '' }] }),
        blur('users.1.name', 'name[1]'),
        overrideByPath('users.1.name', 'Second'),
        { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'users.1.name', issues: ['taken'] } },
      ]);

    it('moves the state of the next row to the position of a removed row', () => {
      const before = aliceAndEmptyBob();
      expect(before.touchedControls['users.1.name']).toBe(true);
      expect(before.touchedControls).not.toHaveProperty('users.0.name');

      const state = makeReducer()(before, removeRow('users', [{ name: '' }], 0));

      expect(state.touchedControls['users.0.name']).toBe(true);
      expect(state.validations['users.0.name']).toEqual(['required']);
      expect(state.injectedValidations['users.0.name']).toEqual(['taken']);
      expect(state.widgetPropOverrides['name[0]']).toEqual({ placeholder: 'Second' });
      expect(propsOf(state, 'name[0]')['placeholder']).toBe('Second');

      expect(state.touchedControls).not.toHaveProperty('users.1.name');
      expect(state.validations).not.toHaveProperty('users.1.name');
      expect(state.injectedValidations).not.toHaveProperty('users.1.name');
      expect(state.widgetPropOverrides).not.toHaveProperty('name[1]');
      expect(state.isFormValid).toBe(false);
    });

    it('keeps the state at the positions when the write does not report a row change', () => {
      const state = makeReducer()(aliceAndEmptyBob(), setWidgetData('users', [{ name: '' }]));

      expect(state.touchedControls).not.toHaveProperty('users.0.name');
      expect(state.widgetPropOverrides).toEqual({});
    });

    it('gives no state to a row added after a removal', () => {
      const reduce = makeReducer();
      const removed = reduce(aliceAndEmptyBob(), removeRow('users', [{ name: '' }], 0));

      const state = reduce(removed, setWidgetData('users', [{ name: '' }, {}]));

      expect(state.touchedControls).not.toHaveProperty('users.1.name');
      expect(state.validations).not.toHaveProperty('users.1.name');
      expect(state.injectedValidations).not.toHaveProperty('users.1.name');
      expect(propsOf(state, 'name[1]')['placeholder']).toBeUndefined();
      expect(propsOf(state, 'name[0]')['placeholder']).toBe('Second');
    });

    it('removes the state of the removed row, so the error of that row does not reach the next row', () => {
      const before = drive([
        init(makeRequiredRowsFormDef()),
        setData({ users: [{ name: '' }, { name: 'Bob' }] }),
        blur('users.0.name', 'name[0]'),
        overrideByPath('users.0.name', 'First'),
      ]);
      expect(before.isFormValid).toBe(false);

      const state = makeReducer()(before, removeRow('users', [{ name: 'Bob' }], 0));

      expect(state.validations['users.0.name']).toBeNull();
      expect(state.touchedControls).not.toHaveProperty('users.0.name');
      expect(state.widgetPropOverrides).toEqual({});
      expect(propsOf(state, 'name[0]')['placeholder']).toBeUndefined();
      expect(state.isFormValid).toBe(true);
    });

    it('removes a prop that only the override of a removed row had set', () => {
      const before = drive([
        init(makeRequiredRowsFormDef()),
        setData({ users: [{ name: 'Alice' }, { name: 'Bob' }] }),
        {
          type: 'OVERRIDE_WIDGET_PROP',
          payload: { path: 'users.0.name', prop: 'readonly', value: true },
        },
      ]);
      expect(propsOf(before, 'name[0]')['readonly']).toBe(true);

      const state = makeReducer()(before, removeRow('users', [{ name: 'Bob' }], 0));

      expect(propsOf(state, 'name[0]')).not.toHaveProperty('readonly');
    });

    it('keeps the shown errors after a submit attempt when a row is removed', () => {
      const before = drive([
        init(makeRequiredRowsFormDef()),
        setData({ users: [{ name: 'Alice' }, { name: '' }, { name: 'Carol' }] }),
        validateAllAction,
      ]);

      const state = makeReducer()(before, removeRow('users', [{ name: '' }, { name: 'Carol' }], 0));

      expect(state.touchedControls).toEqual({
        users: true,
        'users.0.name': true,
        'users.1.name': true,
      });
      expect(state.validations).toEqual({
        users: null,
        'users.0.name': ['required'],
        'users.1.name': null,
      });
      expect(state.isFormValid).toBe(false);
    });

    it('keeps the rows before the removed row at their positions', () => {
      const before = drive([
        init(makeRequiredRowsFormDef()),
        setData({ users: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] }),
        overrideByPath('users.0.name', 'First'),
        overrideByPath('users.1.name', 'Second'),
        overrideByPath('users.2.name', 'Third'),
      ]);

      const state = makeReducer()(before, removeRow('users', [{ name: 'A' }, { name: 'C' }], 1));

      expect(state.widgetPropOverrides).toEqual({
        'name[0]': { placeholder: 'First' },
        'name[1]': { placeholder: 'Third' },
      });
    });

    it('moves a row at position 10 by its number, not by the text of its path', () => {
      const names = Array.from({ length: 11 }, (_, index) => ({ name: `row ${index}` }));
      const before = drive([
        init(makeRequiredRowsFormDef()),
        setData({ users: names }),
        { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'users.10.name', issues: ['taken'] } },
        overrideByPath('users.10.name', 'Eleventh'),
      ]);

      const state = makeReducer()(
        before,
        removeRow(
          'users',
          names.filter((_, index) => index !== 1),
          1,
        ),
      );

      expect(state.injectedValidations['users.9.name']).toEqual(['taken']);
      expect(state.widgetPropOverrides).toEqual({ 'name[9]': { placeholder: 'Eleventh' } });
    });

    it('moves the state of a repeater of plain values', () => {
      const before = drive([
        init({
          form: [
            {
              uid: 'tags',
              kind: 'input',
              type: 'repeater',
              path: 'tags',
              props: { template: plainRow('tag', 'tags') },
            },
          ],
        }),
        setData({ tags: ['a', 'b'] }),
        blur('tags.1', 'tag[1]'),
        overrideByPath('tags.1', 'Second'),
      ]);
      expect(before.touchedControls['tags.1']).toBe(true);

      const state = makeReducer()(before, removeRow('tags', ['b'], 0));

      expect(state.touchedControls['tags.0']).toBe(true);
      expect(state.touchedControls).not.toHaveProperty('tags.1');
      expect(state.widgetPropOverrides).toEqual({ 'tag[0]': { placeholder: 'Second' } });
    });

    it('does not move the state of another repeater', () => {
      const makeRepeater = (uid: string, path: string, inputUid: string) => ({
        uid,
        kind: 'input',
        type: 'repeater',
        path,
        props: {
          template: {
            uid: `${uid}Row`,
            kind: 'layout',
            type: 'flex',
            children: [
              { uid: inputUid, kind: 'input', type: 'textinput', path: `${path}.items.name` },
            ],
          },
        },
      });
      const before = drive([
        init({
          form: [
            makeRepeater('users', 'users', 'name'),
            makeRepeater('owners', 'usersOwners', 'owner'),
          ],
        }),
        setData({ users: [{}, {}], usersOwners: [{}, {}] }),
        blur('usersOwners.1.name', 'owner[1]'),
        overrideByPath('usersOwners.1.name', 'Second owner'),
      ]);

      const state = makeReducer()(before, removeRow('users', [{}], 0));

      expect(state.touchedControls['usersOwners.1.name']).toBe(true);
      expect(state.widgetPropOverrides).toEqual({ 'owner[1]': { placeholder: 'Second owner' } });
    });

    it('does not move the state of a static input whose path points into a row', () => {
      const repeater = makeRequiredRowsFormDef().form[0];
      const before = drive([
        init({
          form: [
            repeater,
            {
              uid: 'secondEmail',
              kind: 'input',
              type: 'textinput',
              path: 'users.1.email',
              validator: { required: true },
            },
          ],
        }),
        setData({ users: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] }),
        blur('users.1.email', 'secondEmail'),
        overrideByPath('users.1.email', 'Email'),
        overrideByPath('users.1.name', 'Second'),
      ]);
      expect(before.touchedControls['users.1.email']).toBe(true);

      const state = makeReducer()(before, removeRow('users', [{ name: 'B' }, { name: 'C' }], 0));

      expect(state.touchedControls['users.1.email']).toBe(true);
      expect(state.touchedControls).not.toHaveProperty('users.0.email');
      expect(state.validations['users.1.email']).toEqual(['required']);
      expect(state.widgetPropOverrides).toEqual({
        secondEmail: { placeholder: 'Email' },
        'name[0]': { placeholder: 'Second' },
      });
    });

    describe('nested repeaters', () => {
      const devName = (name: string) => ({ name, active: true });

      const twoTeams = () =>
        drive([
          init(makeNestedRepeaterFormDef()),
          setData({
            teams: [
              { devs: [devName('Ada'), devName('Linus')] },
              { devs: [devName('Grace'), devName('Ken')] },
            ],
          }),
          blur('teams.1.devs.1.name', 'devName[1][1]'),
          overrideByPath('teams.0.devs.1.name', 'Linus'),
          overrideByPath('teams.1.devs.1.name', 'Ken'),
        ]);

      it('moves the state of the rows inside an outer row that moves', () => {
        const before = twoTeams();
        expect(before.touchedControls['teams.1.devs.1.name']).toBe(true);

        const state = makeReducer()(
          before,
          removeRow('teams', [{ devs: [devName('Grace'), devName('Ken')] }], 0),
        );

        expect(state.touchedControls['teams.0.devs.1.name']).toBe(true);
        expect(state.touchedControls).not.toHaveProperty('teams.1.devs.1.name');
        expect(state.widgetPropOverrides).toEqual({ 'devName[0][1]': { placeholder: 'Ken' } });
        expect(propsOf(state, 'devName[0][1]')['placeholder']).toBe('Ken');
      });

      it('moves only the rows of the inner repeater that changed', () => {
        const state = makeReducer()(twoTeams(), removeRow('teams.1.devs', [devName('Ken')], 0));

        expect(state.touchedControls['teams.1.devs.0.name']).toBe(true);
        expect(state.touchedControls).not.toHaveProperty('teams.1.devs.1.name');
        expect(state.widgetPropOverrides).toEqual({
          'devName[0][1]': { placeholder: 'Linus' },
          'devName[1][0]': { placeholder: 'Ken' },
        });
      });
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

    it('SET_WIDGET_DATA on a path no input owns writes the value and runs a derive', () => {
      // No input of the base form owns `age`. The `adult` state reads it.
      const before = drive([init(makeBaseFormDef()), setData({})]);
      expect(before.widgetFlags['bio']).toEqual({ hidden: true });

      const reduce = makeReducer();
      const state = reduce(before, setWidgetData('age', 21));

      expect(state.data).toEqual({ age: 21 });
      expect(state.currentStates).toEqual(['adult']);
      expect(state.widgetFlags['bio']).toEqual({ hidden: false });
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

    it('touches an input that a failing derive reveals only after the next good derive', () => {
      const formDef = {
        ...makeGatedInputFormDef(),
        form: [
          ...makeGatedInputFormDef().form,
          {
            uid: 'oops',
            kind: 'display',
            type: 'heading',
            props: { text: '{{$form.missing.deep}}' },
          },
        ],
      };
      const validated = drive([
        init(formDef),
        setData({ age: 10, missing: { deep: 1 } }),
        validateAllAction,
      ]);
      expect(validated.allControlsValidated).toBe(true);

      const reduce = makeReducer();
      const errored = reduce(validated, setData({ age: 21 }));

      expect(errored.formHealth).toMatchObject({ status: 'errored', code: 40 });
      expect(errored.touchedControls).toEqual({});
      expect(errored.validations['secret']).toBeUndefined();

      const healed = reduce(errored, setData({ age: 21, missing: { deep: 1 } }));

      expect(healed.formHealth).toEqual({ status: 'ok' });
      expect(healed.touchedControls).toEqual({ secret: true });
      expect(healed.validations['secret']).toEqual(['required']);
      expect(healed.isFormValid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 19. Actions that address a widget calculatedWidgets does not hold
  // ---------------------------------------------------------------------------

  describe('actions that address a widget calculatedWidgets does not hold', () => {
    // Both actions carry a uid. A widget that is not in the form has no entry, and neither action
    // may throw for it: OVERRIDE_WIDGET_PROP is a public API called from event handlers, and
    // ATTEMPT_VALIDATION rides on DOM events that can outlive a mount. A HIDDEN widget is a
    // different case, it is still in `resolvedSources` and both actions reach it (section 26).
    it('OVERRIDE_WIDGET_PROP warns and returns the same state for a uid no form produces', () => {
      const initial = drive([init(makeBaseFormDef()), setData({})]);

      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const reduce = makeReducer();

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

    it('keeps the reference of a static prop when a state changes another prop', () => {
      const options = [{ label: 'A', value: 'a' }];
      const formDef = {
        states: { on: '$form.on === true' },
        form: [
          {
            uid: 'choice',
            kind: 'input',
            type: 'dropdown',
            path: 'choice',
            props: { options, label: 'Off', 'label.on': 'On' },
          },
        ],
      };
      const off = drive([init(formDef), setData({})]);

      const reduce = makeReducer();
      const on = reduce(off, setData({ on: true }));

      expect(propsOf(on, 'choice')['label']).toBe('On');
      expect(on.calculatedWidgets['choice']).not.toBe(off.calculatedWidgets['choice']);
      expect(propsOf(on, 'choice')['options']).toBe(propsOf(off, 'choice')['options']);
    });

    it('keeps the child uids of a layout when a state changes its size', () => {
      const formDef = {
        states: { big: '$form.big === true' },
        form: [
          {
            uid: 'card',
            kind: 'layout',
            type: 'flex',
            size: 6,
            'size.big': 12,
            children: [
              { uid: 'title', kind: 'display', type: 'heading' },
              { uid: 'subtitle', kind: 'display', type: 'heading' },
            ],
          },
        ],
      };
      const small = drive([init(formDef), setData({})]);

      const reduce = makeReducer();
      const big = reduce(small, setData({ big: true }));

      const sizeOf = (state: State) =>
        (state.calculatedWidgets['card'].current as LayoutWidget<string>).size;
      expect(sizeOf(small)).toBe(6);
      expect(sizeOf(big)).toBe(12);
      expect(childUidsOf(small, 'card')).toEqual(['title', 'subtitle']);
      expect(childUidsOf(big, 'card')).toEqual(['title', 'subtitle']);
    });

    it('keeps the content of a widget flag after a SET_META that does not change it', () => {
      const formDef = {
        form: [
          { uid: 'debugOnly', kind: 'display', type: 'heading', include: { when: '$meta.debug' } },
        ],
      };
      const before = drive([init(formDef), setData({})]);

      const reduce = makeReducer();
      const after = reduce(before, { type: 'SET_META', payload: { meta: { mode: 'edit' } } });

      expect(after.widgetFlags['debugOnly']).toEqual({ hidden: true });
      expect(after.widgetFlags['debugOnly']).toEqual(before.widgetFlags['debugOnly']);
    });

    it('keeps the validation array when VALIDATE_ALL finds the same failure again', () => {
      let message = 'required';
      const alwaysFails: ValidatorFn<unknown> = () => ({
        '~standard': {
          version: 1,
          vendor: 'reducer-spec',
          validate: () => ({ issues: [{ message }] }),
        },
      });
      const formDef = {
        form: [
          { uid: 'firstName', kind: 'input', type: 'textinput', path: 'firstName', validator: {} },
        ],
      };
      const first = drive(
        [init(formDef), setData({}), validateAllAction],
        'eager',
        alwaysFails as ValidatorFn<any>,
      );

      const reduce = makeReducer('eager', alwaysFails as ValidatorFn<any>);
      const same = reduce(first, validateAllAction);
      message = 'too short';
      const different = reduce(same, validateAllAction);

      expect(first.validations['firstName']).toEqual(['required']);
      expect(same.validations['firstName']).toBe(first.validations['firstName']);
      expect(different.validations['firstName']).toEqual(['too short']);
    });
  });

  // ---------------------------------------------------------------------------
  // 21. Hidden layout descendants
  // ---------------------------------------------------------------------------

  describe('hidden layout descendants', () => {
    /** A gated section holding a required input directly and another through an inner layout. */
    const makeGatedSectionFormDef = () => ({
      states: { business: "$form.mode === 'business'" },
      form: [
        { uid: 'mode', kind: 'input', type: 'textinput', path: 'mode' },
        {
          uid: 'section',
          kind: 'layout',
          type: 'flex',
          include: { in: ['business'] },
          children: [
            {
              uid: 'vatNumber',
              kind: 'input',
              type: 'textinput',
              path: 'vatNumber',
              validator: { required: true },
            },
            {
              uid: 'bankDetails',
              kind: 'layout',
              type: 'flex',
              children: [
                {
                  uid: 'iban',
                  kind: 'input',
                  type: 'textinput',
                  path: 'iban',
                  validator: { required: true },
                },
              ],
            },
          ],
        },
      ],
    });

    /** The gated section holds a repeater, so hiding must reach the expanded rows. */
    const makeGatedSectionWithRepeaterFormDef = () => ({
      states: { business: "$form.mode === 'business'" },
      form: [
        { uid: 'mode', kind: 'input', type: 'textinput', path: 'mode' },
        {
          uid: 'section',
          kind: 'layout',
          type: 'flex',
          include: { in: ['business'] },
          children: [
            {
              uid: 'branches',
              kind: 'input',
              type: 'repeater',
              path: 'branches',
              props: {
                template: {
                  uid: 'branchRow',
                  kind: 'layout',
                  type: 'flex',
                  children: [
                    {
                      uid: 'branchName',
                      kind: 'input',
                      type: 'textinput',
                      path: 'branches.items.name',
                      validator: { required: true },
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    });

    /** A repeater whose rows hold a per-row gated inner layout with a required input. */
    const makeGatedRowSectionFormDef = () => ({
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
                  uid: 'extra',
                  kind: 'layout',
                  type: 'flex',
                  include: { when: '$item.showExtra === true' },
                  children: [
                    {
                      uid: 'extraNote',
                      kind: 'input',
                      type: 'textinput',
                      path: 'users.items.note',
                      validator: { required: true },
                    },
                  ],
                },
              ],
            },
          },
        },
      ],
    });

    it('hides every widget below a hidden layout, transitively', () => {
      const state = drive([init(makeGatedSectionFormDef()), setData({ mode: 'personal' })]);

      expect(state.widgetFlags['section']).toEqual({ hidden: true });
      expect(state.widgetFlags['vatNumber']).toEqual({ hidden: true });
      expect(state.widgetFlags['bankDetails']).toEqual({ hidden: true });
      expect(state.widgetFlags['iban']).toEqual({ hidden: true });
      expect(state.calculatedWidgets).not.toHaveProperty('vatNumber');
      expect(state.calculatedWidgets).not.toHaveProperty('bankDetails');
      expect(state.calculatedWidgets).not.toHaveProperty('iban');
    });

    it('leaves the descendants unflagged while the layout is visible', () => {
      const state = drive([init(makeGatedSectionFormDef()), setData({ mode: 'business' })]);

      expect(state.widgetFlags['section']).toEqual({ hidden: false });
      expect(state.widgetFlags).not.toHaveProperty('vatNumber');
      expect(state.calculatedWidgets['vatNumber'].current.uid).toBe('vatNumber');
      expect(state.calculatedWidgets['iban'].current.uid).toBe('iban');
    });

    it('a submit with a hidden section ignores its required inputs', () => {
      const state = drive([
        init(makeGatedSectionFormDef()),
        setData({ mode: 'personal' }),
        validateAllAction,
      ]);

      expect(state.isFormValid).toBe(true);
      expect(state.validations).not.toHaveProperty('vatNumber');
      expect(state.validations).not.toHaveProperty('iban');
      expect(state.touchedControls).toEqual({ mode: true });
    });

    it('prunes the hidden section values from the submit payload', () => {
      const state = drive([
        init(makeGatedSectionFormDef()),
        setData({ mode: 'personal', vatNumber: 'DE123', iban: 'DE00' }),
      ]);

      expect(pruneHiddenData(state)).toEqual({ mode: 'personal' });
    });

    it('hides the rows of a repeater inside a hidden section', () => {
      const state = drive([
        init(makeGatedSectionWithRepeaterFormDef()),
        setData({ mode: 'personal', branches: [{ name: '' }] }),
        validateAllAction,
      ]);

      expect(state.widgetFlags['branches']).toEqual({ hidden: true });
      expect(state.widgetFlags['branchName[0]']).toEqual({ hidden: true });
      expect(state.calculatedWidgets).not.toHaveProperty('branchName[0]');
      expect(state.isFormValid).toBe(true);
      expect(pruneHiddenData(state)).toEqual({ mode: 'personal' });
    });

    it('hides only the gated row subtree, not the other rows', () => {
      const state = drive([
        init(makeGatedRowSectionFormDef()),
        setData({
          users: [
            { showExtra: true, note: '' },
            { showExtra: false, note: 'x' },
          ],
        }),
      ]);

      expect(state.widgetFlags['extra[0]']).toEqual({ hidden: false });
      expect(state.widgetFlags['extra[1]']).toEqual({ hidden: true });
      expect(state.widgetFlags['extraNote[1]']).toEqual({ hidden: true });
      expect(state.calculatedWidgets['extraNote[0]'].current.uid).toBe('extraNote[0]');
      expect(state.calculatedWidgets).not.toHaveProperty('extraNote[1]');
    });

    it('touches and validates a revealed section immediately after a submit attempt', () => {
      const submitted = drive([
        init(makeGatedSectionFormDef()),
        setData({ mode: 'personal' }),
        validateAllAction,
      ]);

      const reduce = makeReducer();
      const revealed = reduce(submitted, setData({ mode: 'business' }));

      expect(revealed.validations['vatNumber']).toEqual(['required']);
      expect(revealed.touchedControls['vatNumber']).toBe(true);
      expect(revealed.isFormValid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 22. Data copy-on-write
  // ---------------------------------------------------------------------------

  describe('data copy-on-write', () => {
    /** Two inputs under one parent object, a repeater, and an input with a default. */
    const makeNestedPathsFormDef = () => ({
      form: [
        { uid: 'street', kind: 'input', type: 'textinput', path: 'address.street' },
        { uid: 'city', kind: 'input', type: 'textinput', path: 'address.city' },
        {
          uid: 'theme',
          kind: 'input',
          type: 'textinput',
          path: 'settings.theme',
          defaultValue: 'dark',
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
              children: [
                { uid: 'name', kind: 'input', type: 'textinput', path: 'users.items.name' },
              ],
            },
          },
        },
      ],
    });

    const driveNestedPaths = (): State =>
      drive([
        init(makeNestedPathsFormDef()),
        setData({ address: { street: 'a', city: 'b' }, users: [{ name: 'Ada' }] }),
      ]);

    it('SET_WIDGET_DATA copies the containers along the path and keeps the rest by reference', () => {
      const initial = driveNestedPaths();

      const reduce = makeReducer();
      const state = reduce(initial, setWidgetData('address.street', 'x'));

      expect(state.data['address']['street']).toBe('x');
      expect(state.data).not.toBe(initial.data);
      expect(state.data['address']).not.toBe(initial.data['address']);
      expect(state.data['users']).toBe(initial.data['users']);

      // The previous state keeps its content: nothing wrote into it.
      expect(initial.data['address']['street']).toBe('a');
    });

    it('SET_WIDGET_DATA on a row path gives the repeater array a new identity', () => {
      const initial = drive([
        init(makeNestedPathsFormDef()),
        setData({
          address: { street: 'a', city: 'b' },
          users: [{ name: 'Ada' }, { name: 'Linus' }],
        }),
      ]);

      const reduce = makeReducer();
      const state = reduce(initial, setWidgetData('users.1.name', 'Torvalds'));

      expect(state.data['users']).not.toBe(initial.data['users']);
      expect(state.data['users'][0]).toBe(initial.data['users'][0]);
      expect(state.data['users'][1]).not.toBe(initial.data['users'][1]);
      expect(initial.data['users'][1]['name']).toBe('Linus');
    });

    it('a written default keeps the references of the subtrees it does not touch', () => {
      const payload = { address: { street: 'a', city: 'b' }, users: [{ name: 'Ada' }] };
      const state = drive([init(makeNestedPathsFormDef()), setData(payload)]);

      expect(state.data['settings']['theme']).toBe('dark');
      expect(state.data['address']).toBe(payload.address);
      expect(state.data['users']).toBe(payload.users);
      expect(payload).not.toHaveProperty('settings');
    });
  });

  // ---------------------------------------------------------------------------
  // 23. Function widget controls
  // ---------------------------------------------------------------------------

  // A function widget is stored as the callable itself, so its input shape only exists in
  // `current`. Every pass keyed by the input path has to find it there or on the stamped
  // `source.path`, exactly like a plain input.
  describe('function widget controls', () => {
    const overrideByUid = (uid: string, value: string): Action => ({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: { uid, prop: 'placeholder', value },
    });

    it('VALIDATE_ALL touches the path of a top-level and of a row function widget', () => {
      const state = drive([
        init(makeFunctionWidgetsFormDef()),
        setData({ users: [{ name: '' }] }),
        validateAllAction,
      ]);

      expect(state.touchedControls).toEqual({
        firstName: true,
        users: true,
        'users.0.name': true,
      });
      expect(state.validations).toEqual({
        firstName: ['required'],
        users: null,
        'users.0.name': ['required'],
      });
      expect(state.isFormValid).toBe(false);
    });

    it('touches AND validates a function widget row added after VALIDATE_ALL', () => {
      const validated = drive([
        init(makeFunctionWidgetsFormDef()),
        setData({ firstName: 'Ada', users: [{ name: 'Ada' }] }),
        validateAllAction,
      ]);
      expect(validated.isFormValid).toBe(true);

      const reduce = makeReducer();
      const state = reduce(validated, setWidgetData('users', [{ name: 'Ada' }, {}]));

      expect(state.touchedControls['users.1.name']).toBe(true);
      expect(state.validations['users.1.name']).toEqual(['required']);
      expect(state.isFormValid).toBe(false);
    });

    it('OVERRIDE_WIDGET_PROP by path finds a function widget control and applies the value', () => {
      const initial = drive([
        init(makeFunctionWidgetsFormDef()),
        setData({ firstName: 'Ada', users: [{ name: 'Ada' }] }),
      ]);

      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const reduce = makeReducer();

      const state = reduce(initial, overrideByPath('firstName', 'Your name'));
      const rowState = reduce(state, overrideByPath('users.0.name', 'Row name'));

      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();

      expect(rowState.widgetPropOverrides['firstName']).toEqual({ placeholder: 'Your name' });
      expect(rowState.widgetPropOverrides['rowName[0]']).toEqual({ placeholder: 'Row name' });
      expect(propsOf(rowState, 'firstName')['placeholder']).toBe('Your name');
      expect(propsOf(rowState, 'rowName[0]')['placeholder']).toBe('Row name');
    });

    it('OVERRIDE_WIDGET_PROP by uid reaches the props of a function widget', () => {
      const initial = drive([
        init(makeFunctionWidgetsFormDef()),
        setData({ firstName: 'Ada', users: [] }),
      ]);

      const reduce = makeReducer();
      const state = reduce(initial, overrideByUid('firstName', 'Your name'));

      expect(propsOf(state, 'firstName')['placeholder']).toBe('Your name');
      // The function still owns every other prop it returns.
      expect(propsOf(state, 'firstName')['seenTranslate']).toBe('function');
    });
  });

  // ---------------------------------------------------------------------------
  // 24. A derive-owned error discards the whole pass
  // ---------------------------------------------------------------------------

  // A pass that catches its own error must not publish what the passes before it produced:
  // `fillCalculatedWidgets` seeds new entries with an empty `current`, and a state carrying
  // those placeholders renders widgets with no type and no props.
  describe('a derive-owned error discards the whole pass', () => {
    it('publishes no half-computed widgets when the props pass fails on a new row', () => {
      const ok = drive([init(makeBrokenRowPropFormDef()), setData({ users: [] })]);
      expect(ok.formHealth).toEqual({ status: 'ok' });

      const reduce = makeReducer();
      const errored = reduce(ok, setData({ users: [{ name: 'Ada' }] }));

      expect(errored.formHealth.status).toBe('errored');
      if (errored.formHealth.status === 'errored') {
        expect(errored.formHealth.code).toBe(40);
      }
      // The data change is stored, nothing computed from it is.
      expect(errored.data).toEqual({ users: [{ name: 'Ada' }] });
      expect(errored.calculatedWidgets).toBe(ok.calculatedWidgets);
      expect(errored.resolvedSources).toBe(ok.resolvedSources);
      expect(errored.widgetFlags).toBe(ok.widgetFlags);
      // No entry for the row the failed pass was resolving, and no empty placeholder anywhere.
      expect(errored.calculatedWidgets['greeting[0]']).toBeUndefined();
      const currents = Object.values(errored.calculatedWidgets).map((entry) => entry.current);
      expect(currents.every((current) => Object.keys(current).length > 0)).toBe(true);
    });

    it('recovers the row on the next derive once the props resolve', () => {
      const errored = drive([
        init(makeBrokenRowPropFormDef()),
        setData({ users: [] }),
        setData({ users: [{ name: 'Ada' }] }),
      ]);
      expect(errored.formHealth.status).toBe('errored');

      const reduce = makeReducer();
      const healed = reduce(errored, setData({ users: [] }));

      expect(healed.formHealth).toEqual({ status: 'ok' });
      expect(healed.calculatedWidgets['greeting[0]']).toBeUndefined();
      expect(propsOf(healed, 'title')['text']).toBe('Users');
    });

    it('keeps the entries of a removed row when the pass fails, and drops them in the next good derive', () => {
      const formDef = {
        ...makeBaseFormDef(),
        form: [
          ...makeBaseFormDef().form,
          {
            uid: 'oops',
            kind: 'display',
            type: 'heading',
            props: { text: '{{$form.missing.deep}}' },
          },
        ],
      };
      const twoRows = drive([
        init(formDef),
        setData({ missing: { deep: 1 }, users: [{}, {}] }),
        validateAllAction,
        {
          type: 'OVERRIDE_WIDGET_PROP',
          payload: { uid: 'name[1]', prop: 'placeholder', value: 'Second' },
        },
      ]);
      expect(twoRows.formHealth).toEqual({ status: 'ok' });
      expect(twoRows.touchedControls['users.1.name']).toBe(true);
      expect(twoRows.widgetPropOverrides['name[1]']).toEqual({ placeholder: 'Second' });

      const reduce = makeReducer();
      const errored = reduce(twoRows, setData({ users: [{}] }));

      expect(errored.formHealth).toMatchObject({ status: 'errored', code: 40 });
      expect(errored.touchedControls['users.1.name']).toBe(true);
      expect(errored.widgetPropOverrides['name[1]']).toEqual({ placeholder: 'Second' });
      expect(errored.validations).toHaveProperty('users.1.name');
      expect(errored.calculatedWidgets).toHaveProperty('name[1]');

      const healed = reduce(errored, setData({ missing: { deep: 1 }, users: [{}] }));

      expect(healed.formHealth).toEqual({ status: 'ok' });
      expect(healed.touchedControls).not.toHaveProperty('users.1.name');
      expect(healed.widgetPropOverrides).not.toHaveProperty('name[1]');
      expect(healed.validations).not.toHaveProperty('users.1.name');
      expect(healed.calculatedWidgets).not.toHaveProperty('name[1]');
      expect(healed.calculatedWidgets).toHaveProperty('name[0]');
    });
  });

  // ---------------------------------------------------------------------------
  // 25. A function widget that returns a cached object
  // ---------------------------------------------------------------------------

  // The store writes `uid` and `path` into the widget a function returns. Writing them into the
  // returned object itself corrupts a cached object: two rows overwrite each other, and the
  // object the user owns is modified.
  describe('a function widget that returns a cached object', () => {
    it('gives each row its own uid and path and does not modify the cached object', () => {
      const { cached, formDef } = makeCachedRowWidgetFormDef();

      const state = drive([init(formDef), setData({ users: [{ name: 'Ada' }, { name: 'Bob' }] })]);

      const first = state.calculatedWidgets['rowName[0]'].current as InputWidget<any, string>;
      const second = state.calculatedWidgets['rowName[1]'].current as InputWidget<any, string>;
      expect(first.uid).toBe('rowName[0]');
      expect(first.path).toBe('users.0.name');
      expect(second.uid).toBe('rowName[1]');
      expect(second.path).toBe('users.1.name');
      expect(cached.uid).toBe('cachedRow');
      expect(cached.path).toBe('users.items.name');
    });
  });

  // ---------------------------------------------------------------------------
  // 26. Overrides on a hidden widget
  // ---------------------------------------------------------------------------

  // A hidden widget has no `calculatedWidgets` entry, but it is still in `resolvedSources` and an
  // override stored while it was visible is deliberately kept. Accepting a new one is the same
  // contract. An override only reaches `props`, so it can never reveal the widget by itself.
  describe('overrides on a hidden widget', () => {
    // A test that fails before its own `mockRestore` would otherwise leak the spy into the next one.
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('stores an override by uid and applies it when the widget is revealed', () => {
      const hidden = drive([init(makeBaseFormDef()), setData({ age: 10 })]);
      expect(hidden.widgetFlags['bio']).toEqual({ hidden: true });
      expect(hidden.calculatedWidgets).not.toHaveProperty('bio');

      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const reduce = makeReducer();

      const overridden = reduce(hidden, {
        type: 'OVERRIDE_WIDGET_PROP',
        payload: { uid: 'bio', prop: 'text', value: 'About you' },
      });

      expect(warn).not.toHaveBeenCalled();
      expect(overridden.widgetPropOverrides['bio']).toEqual({ text: 'About you' });
      expect(overridden.widgetFlags['bio']).toEqual({ hidden: true });
      expect(overridden.calculatedWidgets).not.toHaveProperty('bio');

      const revealed = reduce(overridden, setData({ age: 21 }));

      expect(propsOf(revealed, 'bio')['text']).toBe('About you');
    });

    it('stores an override by path and applies it when the input is revealed', () => {
      const hidden = drive([init(makeGatedInputFormDef()), setData({ age: 10 })]);
      expect(hidden.widgetFlags['secret']).toEqual({ hidden: true });
      expect(hidden.calculatedWidgets).not.toHaveProperty('secret');

      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const reduce = makeReducer();

      const overridden = reduce(hidden, {
        type: 'OVERRIDE_WIDGET_PROP',
        payload: { path: 'secret', prop: 'placeholder', value: 'Say it' },
      });

      expect(warn).not.toHaveBeenCalled();
      expect(overridden.widgetPropOverrides['secret']).toEqual({ placeholder: 'Say it' });

      const revealed = reduce(overridden, setData({ age: 21 }));

      expect(propsOf(revealed, 'secret')['placeholder']).toBe('Say it');
    });

    it('still warns for a path no widget in the form owns', () => {
      const hidden = drive([init(makeGatedInputFormDef()), setData({ age: 10 })]);

      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const reduce = makeReducer();

      const same = reduce(hidden, {
        type: 'OVERRIDE_WIDGET_PROP',
        payload: { path: 'ghost', prop: 'placeholder', value: 'Say it' },
      });

      expect(same).toBe(hidden);
      expect(warn).toHaveBeenCalledWith('Input with path "ghost" not found');
    });
  });

  // ---------------------------------------------------------------------------
  // 27. An empty injected issues array is not a failure
  // ---------------------------------------------------------------------------

  describe('empty injected issues', () => {
    it('keeps the form valid when the injected array is empty', () => {
      const state = drive([
        init(makeBaseFormDef()),
        setData({ firstName: 'Joan', age: 20, users: [] }),
        { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'firstName', issues: [] } },
        validateAllAction,
      ]);

      // An empty array displays nothing and touches nothing, so it must not block submit.
      expect(state.injectedValidations['firstName']).toEqual([]);
      expect(state.isFormValid).toBe(true);
    });

    it('still marks the form invalid when the injected array has an issue', () => {
      const state = drive([
        init(makeBaseFormDef()),
        setData({ firstName: 'Joan', age: 20, users: [] }),
        { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'firstName', issues: ['taken'] } },
        validateAllAction,
      ]);

      expect(state.isFormValid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 28. Repeater paths that contain a property named `items`
  // ---------------------------------------------------------------------------

  describe('repeater paths that contain a property named items', () => {
    // `items` is also the row token in template paths. Only the segment right after the
    // repeater's own path is the token, so `invoice.items.items.name` is row 1 of `invoice.items`.
    it('builds the rows with concrete paths', () => {
      const state = drive([init(makeItemsPropertyFormDef()), setData(itemsPropertyData)]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      const name = state.calculatedWidgets['name[1]'].current as InputWidget<any, string>;
      const total = state.calculatedWidgets['itemsTotal[0]'].current as InputWidget<any, string>;
      expect(name.path).toBe('invoice.items.1.name');
      expect(total.path).toBe('invoice.items.0.itemsTotal');
    });

    it('validates each row and writes row data through the concrete path', () => {
      const validated = drive([
        init(makeItemsPropertyFormDef()),
        setData(itemsPropertyData),
        validateAllAction,
      ]);

      expect(validated.validations['invoice.items.1.name']).toEqual(['required']);
      expect(validated.isFormValid).toBe(false);

      const reduce = makeReducer();
      const written = reduce(validated, setWidgetData('invoice.items.1.name', 'Ink'));
      const revalidated = reduce(written, validateAllAction);

      expect(written.data['invoice'].items[1].name).toBe('Ink');
      expect(revalidated.validations['invoice.items.1.name']).toBeNull();
      expect(revalidated.isFormValid).toBe(true);
    });

    it('rewrites only the row token in when expressions', () => {
      const state = drive([init(makeItemsPropertyFormDef()), setData(itemsPropertyData)]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      // `$form.invoice.items.items.priced`: the second `items` is the row token.
      expect(state.widgetFlags['pricedNote[0]']).toEqual({ hidden: false });
      expect(state.widgetFlags['pricedNote[1]']).toEqual({ hidden: true });
      // `$item.items`: the row's own `items` array, not a token.
      expect(state.widgetFlags['partsNote[0]']).toEqual({ hidden: false });
      expect(state.widgetFlags['partsNote[1]']).toEqual({ hidden: true });
    });

    it('prunes a hidden row field whose name starts with items', () => {
      const state = drive([init(makeItemsPropertyFormDef()), setData(itemsPropertyData)]);

      expect(state.widgetFlags['itemsTotal[1]']).toEqual({ hidden: true });
      const pruned = pruneHiddenData(state);
      expect(pruned['invoice'].items[1]).not.toHaveProperty('itemsTotal');
      expect(pruned['invoice'].items[0].itemsTotal).toBe(3);
    });
  });
  // ---------------------------------------------------------------------------
  // 29. Rejected expressions
  // ---------------------------------------------------------------------------

  describe('rejected expressions', () => {
    const driveWithPolicy = (expressionPolicy: ExpressionPolicy, actions: Action[]): State => {
      const reduce = reducer({
        validators: validators as ValidatorFn<any>,
        validateOn: 'eager',
        localization: identityTranslator('en-US'),
        functions,
        expressionPolicy,
      });
      return actions.reduce((state, action) => reduce(state, action), createInitialState('en-US'));
    };

    const heading = (fields: Record<string, unknown>) => ({
      uid: 'title',
      kind: 'display',
      type: 'heading',
      ...fields,
    });

    it('fails an i18n param that writes into the data, and leaves the data unchanged', () => {
      const injection = "$formX || ($form.injected = 'yes')";
      const state = drive([
        init({
          form: [heading({ props: { text: { key: 'greeting', params: { name: injection } } } })],
        }),
        setData({ name: 'Ada' }),
      ]);

      expect(state.formHealth).toEqual({
        status: 'errored',
        code: 50,
        message: `[50] Rejected expression "${injection}": [EXPRESSION_REJECTED] The assignment "=" writes into the data. Expressions can only read.`,
      });
      expect(state.data).toEqual({ name: 'Ada' });
    });

    it.each([
      ['a {{ }} interpolation', heading({ props: { text: "Hi {{ $form.injected = 'yes' }}" } })],
      [
        'an include.when rule',
        heading({ include: { when: "($form.injected = 'yes') === 'yes'" } }),
      ],
      [
        'a disabled.when rule',
        {
          uid: 'name',
          kind: 'input',
          type: 'textinput',
          path: 'name',
          disabled: { when: '$form.tags.push(1) > 0' },
        },
      ],
    ])('fails %s that writes into the data', (_site, widget) => {
      const state = drive([init({ form: [widget] }), setData({ name: 'Ada', tags: [] })]);

      expect(state.formHealth.status).toBe('errored');
      if (state.formHealth.status === 'errored') {
        expect(state.formHealth.code).toBe(50);
      }
      expect(state.data).toEqual({ name: 'Ada', tags: [] });
    });

    it('fails a states expression instead of treating it as false', () => {
      const state = drive([
        init({ states: { injected: "($form.injected = 'yes') === 'yes'" }, form: [heading({})] }),
        setData({ name: 'Ada' }),
      ]);

      expect(state.formHealth.status).toBe('errored');
      if (state.formHealth.status === 'errored') {
        expect(state.formHealth.code).toBe(50);
      }
      expect(state.data).toEqual({ name: 'Ada' });
    });

    it('fails a code execution path with the warn policy', () => {
      const state = drive([
        init({
          form: [heading({ props: { text: "{{ (x => x)['constr' + 'uctor']('return 1')() }}" } })],
        }),
        setData({}),
      ]);

      expect(state.formHealth.status).toBe('errored');
      if (state.formHealth.status === 'errored') {
        expect(state.formHealth.code).toBe(50);
        expect(state.formHealth.message).toContain('Rejected call');
      }
    });

    it('runs a method outside the allowed list with the warn policy and fails it with strict', () => {
      const formDef = { form: [heading({ include: { when: "$form.name.startsWith('A')" } })] };
      const actions = [init(formDef), setData({ name: 'Ada' })];

      const warned = driveWithPolicy('warn', actions);
      expect(warned.formHealth).toEqual({ status: 'ok' });
      expect(warned.widgetFlags['title']).toEqual({ hidden: false });

      const strict = driveWithPolicy('strict', [init(formDef), setData({ name: 'Ada' })]);
      expect(strict.formHealth.status).toBe('errored');
      if (strict.formHealth.status === 'errored') {
        expect(strict.formHealth.code).toBe(50);
        expect(strict.formHealth.message).toContain('"startsWith"');
      }
    });

    it('recovers when the repeater row that holds a rejected expression is removed', () => {
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
                children: [heading({ uid: 'rowTitle', props: { text: '{{ $item.tags.pop() }}' } })],
              },
            },
          },
        ],
      };
      const errored = drive([init(formDef), setData({ users: [{ tags: ['a'] }] })]);
      expect(errored.formHealth.status).toBe('errored');
      expect(errored.data).toEqual({ users: [{ tags: ['a'] }] });

      const reduce = makeReducer();
      const healed = reduce(errored, setData({ users: [] }));
      expect(healed.formHealth).toEqual({ status: 'ok' });
    });

    describe('size limits', () => {
      const showWhen = (when: string) => ({
        form: [heading({ include: { when } })],
      });
      const sizedExpressions = {
        characters: `$form.a ===${' '.repeat(EXPRESSION_LIMITS.maxLength)}1`,
        'AST nodes': `[${'1,'.repeat(EXPRESSION_LIMITS.maxNodes)}1].length > 0`,
        'AST depth': `${'!'.repeat(EXPRESSION_LIMITS.maxDepth)}$form.a`,
      };

      it.each(Object.entries(sizedExpressions))(
        'runs an expression over the limit of %s with the warn policy',
        (_limit, expression) => {
          const state = driveWithPolicy('warn', [init(showWhen(expression)), setData({ a: 1 })]);

          expect(state.formHealth).toEqual({ status: 'ok' });
          // The widget is shown, so the expression ran to the end and gave true.
          expect(state.widgetFlags['title']).toEqual({ hidden: false });
        },
      );

      it.each(Object.entries(sizedExpressions))(
        'fails an expression over the limit of %s with the strict policy',
        (limit, expression) => {
          const state = driveWithPolicy('strict', [init(showWhen(expression)), setData({ a: 1 })]);

          expect(state.formHealth.status).toBe('errored');
          if (state.formHealth.status === 'errored') {
            expect(state.formHealth.code).toBe(50);
            expect(state.formHealth.message).toContain('[EXPRESSION_TOO_LARGE]');
            expect(state.formHealth.message).toContain(limit);
          }
        },
      );

      it('runs an expression of exactly the maximum length with the strict policy', () => {
        const fillerLength = EXPRESSION_LIMITS.maxLength - '$form.a ===1'.length;
        const expression = `$form.a ===${' '.repeat(fillerLength)}1`;
        expect(expression).toHaveLength(EXPRESSION_LIMITS.maxLength);

        const state = driveWithPolicy('strict', [init(showWhen(expression)), setData({ a: 1 })]);

        expect(state.formHealth).toEqual({ status: 'ok' });
        expect(state.widgetFlags['title']).toEqual({ hidden: false });
      });

      it('runs expressions with exactly the maximum nodes and depth with the strict policy', () => {
        const nodeItems = EXPRESSION_LIMITS.maxNodes - measureExpression('[].length > 0').nodes;
        const atNodeLimit = `[${Array(nodeItems).fill('1').join(',')}].length > 0`;
        const atDepthLimit = `${'!'.repeat(EXPRESSION_LIMITS.maxDepth - 2)}$form.a`;
        expect(measureExpression(atNodeLimit).nodes).toBe(EXPRESSION_LIMITS.maxNodes);
        expect(measureExpression(atDepthLimit).depth).toBe(EXPRESSION_LIMITS.maxDepth);

        for (const expression of [atNodeLimit, atDepthLimit]) {
          const state = driveWithPolicy('strict', [init(showWhen(expression)), setData({ a: 1 })]);

          expect(state.formHealth).toEqual({ status: 'ok' });
          expect(state.widgetFlags['title']).toEqual({ hidden: false });
        }
      });

      it('runs a small expression over a large array to the end', () => {
        const items = Array.from({ length: 100_000 }, () => 1);
        const state = driveWithPolicy('strict', [
          init(showWhen('$form.items.reduce((sum, item) => sum + item, 0) === 100000')),
          setData({ items }),
        ]);

        expect(state.formHealth).toEqual({ status: 'ok' });
        expect(state.widgetFlags['title']).toEqual({ hidden: false });
      });
    });
  });

  describe('scope roots that core does not know', () => {
    const heading = (fields: Record<string, unknown>) => ({
      uid: 'title',
      kind: 'display',
      type: 'heading',
      ...fields,
    });

    it('treats a state that reads an unknown root as inactive', () => {
      const state = drive([
        init({
          states: { routed: '$route.id === 1', known: '$form.id === 1' },
          form: [heading({})],
        }),
        setData({ id: 1 }),
      ]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.currentStates).toEqual(['known']);
    });

    it('gives an empty string for a template that is an unknown root', () => {
      const state = drive([
        init({ form: [heading({ props: { text: 'a{{ $route }}b' } })] }),
        setData({}),
      ]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(propsOf(state, 'title')['text']).toBe('ab');
    });

    it('fails with code 40 for a template that reads a property of an unknown root', () => {
      const state = drive([
        init({ form: [heading({ props: { text: '{{ $route.id }}' } })] }),
        setData({}),
      ]);

      expect(state.formHealth.status).toBe('errored');
      if (state.formHealth.status === 'errored') {
        expect(state.formHealth.code).toBe(40);
      }
    });

    it('fails with code 11 for an include.when rule that reads an unknown root', () => {
      const state = drive([
        init({ form: [heading({ include: { when: '$route.id === 1' } })] }),
        setData({}),
      ]);

      expect(state.formHealth.status).toBe('errored');
      if (state.formHealth.status === 'errored') {
        expect(state.formHealth.code).toBe(11);
      }
    });
  });

  describe('keys that a widget kind does not have', () => {
    const driveWidget = (widget: Record<string, unknown>): State =>
      drive([init({ form: [widget] }), setData({})]);

    it('drops on from a display widget, and keeps it on an action widget', () => {
      const display = driveWidget({
        uid: 'title',
        kind: 'display',
        type: 'heading',
        on: { click: 'headingClicked' },
      });
      const action = driveWidget({
        uid: 'save',
        kind: 'action',
        type: 'button',
        on: { click: 'saveClicked' },
      });

      expect(display.formHealth).toEqual({ status: 'ok' });
      expect(display.flatForm['title']).not.toHaveProperty('on');
      expect(display.calculatedWidgets['title'].current).not.toHaveProperty('on');
      // The same key stays on a kind that has it.
      expect(action.flatForm['save']).toHaveProperty('on');
      expect(action.calculatedWidgets['save'].current).toHaveProperty('on', {
        click: 'saveClicked',
      });
    });

    it('drops label from a display widget', () => {
      const state = driveWidget({ uid: 'title', kind: 'display', type: 'heading', label: 'Title' });

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.flatForm['title']).not.toHaveProperty('label');
      expect(state.calculatedWidgets['title'].current).not.toHaveProperty('label');
    });

    it('drops defaultValue from an action widget, and keeps it on an input widget', () => {
      const action = driveWidget({
        uid: 'save',
        kind: 'action',
        type: 'button',
        defaultValue: 'x',
      });
      const input = driveWidget({
        uid: 'name',
        kind: 'input',
        type: 'textinput',
        path: 'name',
        defaultValue: 'x',
      });

      expect(action.formHealth).toEqual({ status: 'ok' });
      expect(action.flatForm['save']).not.toHaveProperty('defaultValue');
      expect(action.calculatedWidgets['save'].current).not.toHaveProperty('defaultValue');
      expect(input.flatForm['name']).toHaveProperty('defaultValue', 'x');
    });
  });

  describe('invalid widget definitions', () => {
    const expectDecodeError = (formDef: Record<string, any>, expectedMessage: string) => {
      const state = drive([init(formDef), setData({})]);

      expect(state.formHealth).toMatchObject({
        status: 'errored',
        code: errorCodes.initializeUnknownError,
      });
      expect((state.formHealth as { message: string }).message).toContain(expectedMessage);
    };

    it('gives code 22 for a repeater without props', () => {
      expectDecodeError(
        { form: [{ kind: 'input', type: 'repeater', path: 'contacts' }] },
        'props.template',
      );
    });

    it('gives code 22 for a repeater with props and no template', () => {
      expectDecodeError(
        { form: [{ kind: 'input', type: 'repeater', path: 'contacts', props: {} }] },
        'props.template',
      );
    });

    it('gives code 22 for an invalid template of a nested repeater', () => {
      const repeaterWith = (path: string, child: Record<string, any>) => ({
        kind: 'input',
        type: 'repeater',
        path,
        props: { template: { kind: 'layout', type: 'flex', children: [child] } },
      });

      expectDecodeError(
        {
          form: [
            repeaterWith(
              'orders',
              repeaterWith('orders.items.lines', { kind: 'input', type: 'text' }),
            ),
          ],
        },
        'props.template.children[0].props.template.children[0]',
      );
    });

    it('keeps the other props of a valid repeater and leaves the definition unchanged', () => {
      const template = {
        uid: 'row',
        kind: 'layout',
        type: 'flex',
        children: [{ uid: 'name', kind: 'input', type: 'text', path: 'users.items.name' }],
      };
      const props = { addLabel: 'Add', template };
      const state = drive([
        init({ form: [{ uid: 'users', kind: 'input', type: 'repeater', path: 'users', props }] }),
        setData({ users: [{ name: 'Alice' }] }),
      ]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect((state.flatForm['users'] as { props: unknown }).props).toMatchObject({
        addLabel: 'Add',
        template: { uid: 'row' },
      });
      expect(props.template).toBe(template);
    });

    it('gives code 22 for a row function that reads $item without a check', () => {
      const rowFunction = ({ $item }: any) => ({
        uid: 'city',
        kind: 'input',
        type: 'text',
        path: 'users.items.city',
        label: $item.country,
      });

      expectDecodeError(
        {
          form: [
            {
              kind: 'input',
              type: 'repeater',
              path: 'users',
              props: { template: { kind: 'layout', type: 'flex', children: [rowFunction] } },
            },
          ],
        },
        'country',
      );
    });

    it.each([
      ['undefined', () => undefined],
      ['null', () => null],
      ['an array', () => []],
    ])('gives code 22 for a widget function that returns %s', (_name, widgetFunction) => {
      expectDecodeError({ form: [widgetFunction] }, 'Expected the widget function to return');
    });
  });

  describe('failing validators', () => {
    let consoleError: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
      consoleError.mockRestore();
    });

    const emailInput = {
      uid: 'email',
      kind: 'input',
      type: 'text',
      path: 'email',
      validator: { required: true },
    };
    const nameInput = {
      uid: 'name',
      kind: 'input',
      type: 'text',
      path: 'name',
      validator: { required: true },
    };
    const validatorsThrowing: ValidatorFn<any> = () => {
      throw new Error('Unknown custom rule "iban"');
    };
    const asyncValidators: ValidatorFn<any> = () => ({
      '~standard': {
        version: 1,
        vendor: 'reducer-spec',
        validate: async (value: unknown) => ({ value }),
      },
    });

    const validateAllAction: Action = { type: 'VALIDATE_ALL' };
    const blurAction: Action = {
      type: 'ATTEMPT_VALIDATION',
      payload: { reason: 'blur', path: 'email', uid: 'email' },
    };

    it.each([
      ['the validators factory throws', validatorsThrowing, 'Unknown custom rule "iban"'],
      ['a schema is async', asyncValidators, 'Schema validation must be synchronous'],
    ])('gives code 60 with the input path on submit when %s', (_case, failing, reason) => {
      const state = drive(
        [init({ form: [emailInput] }), setData({ email: 'a@b.c' }), validateAllAction],
        'eager',
        failing,
      );

      expect(state.formHealth).toMatchObject({
        status: 'errored',
        code: errorCodes.validationError,
      });
      const { message } = state.formHealth as { message: string };
      expect(message).toContain('[60]');
      expect(message).toContain('"email"');
      expect(message).toContain(reason);
      expect(state.isFormValid).toBe(false);
    });

    it('gives code 60 on a blur', () => {
      const state = drive(
        [init({ form: [emailInput] }), setData({ email: 'a@b.c' }), blurAction],
        'eager',
        validatorsThrowing,
      );

      expect(state.formHealth).toMatchObject({ code: errorCodes.validationError });
      expect(state.isFormValid).toBe(false);
    });

    it('logs the original error once, so the developer gets its stack', () => {
      const original = new Error('Unknown custom rule "iban"');
      const reduce = makeReducer('eager', () => {
        throw original;
      });
      const failed = [
        init({ form: [emailInput] }),
        setData({ email: 'a@b.c' }),
        validateAllAction,
      ].reduce(reduce, createInitialState('en-US'));
      reduce(failed, validateAllAction);

      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(consoleError.mock.calls[0]).toContain(original);
    });

    it('names the input when a schema returns a result that is not valid', () => {
      const returnsNoResult: ValidatorFn<any> = () => ({
        '~standard': {
          version: 1,
          vendor: 'reducer-spec',
          validate: () => undefined as unknown as StandardSchemaV1.Result<unknown>,
        },
      });
      const state = drive(
        [init({ form: [emailInput] }), setData({ email: 'a@b.c' }), validateAllAction],
        'eager',
        returnsNoResult,
      );

      expect(state.formHealth).toMatchObject({ code: errorCodes.validationError });
      expect((state.formHealth as { message: string }).message).toContain('"email"');
    });

    it('sets isFormValid to false when a validator fails after a prop override', () => {
      let isBroken = false;
      const reduce = makeReducer('eager', (validator, localization) => {
        if (isBroken) {
          throw new Error('broken');
        }
        return (validators as ValidatorFn<any>)(validator, localization);
      });
      const valid = [
        init({ form: [emailInput] }),
        setData({ email: 'a@b.c' }),
        validateAllAction,
      ].reduce(reduce, createInitialState('en-US'));
      expect(valid.isFormValid).toBe(true);

      isBroken = true;
      const state = reduce(valid, {
        type: 'OVERRIDE_WIDGET_PROP',
        payload: { path: 'email', prop: 'placeholder', value: 'Your email' },
      });

      expect(state.formHealth).toMatchObject({ code: errorCodes.validationError });
      expect(state.isFormValid).toBe(false);
    });

    it('computes the data written after the failure when the app clears the health', () => {
      let isBroken = true;
      const reduce = makeReducer('eager', (validator, localization) => {
        if (isBroken) {
          throw new Error('broken');
        }
        return (validators as ValidatorFn<any>)(validator, localization);
      });
      const extraInput = {
        ...nameInput,
        include: { when: '$form.more === true' },
      };
      const failed = [
        init({ form: [emailInput, extraInput] }),
        setData({ email: 'a@b.c', more: true }),
        validateAllAction,
      ].reduce(reduce, createInitialState('en-US'));
      const afterTyping = reduce(failed, setWidgetData('more', false));
      expect(afterTyping.widgetFlags['name']?.hidden).not.toBe(true);

      isBroken = false;
      const cleared = reduce(afterTyping, {
        type: 'SET_FORM_HEALTH',
        payload: { formHealth: { status: 'ok' } },
      });

      expect(cleared.widgetFlags['name']?.hidden).toBe(true);
      expect(cleared.isFormValid).toBe(true);

      const validated = reduce(cleared, validateAllAction);

      expect(validated.validations).not.toHaveProperty('name');
      expect(validated.isFormValid).toBe(true);
    });

    it('gives the message of a thrown value that is not an Error', () => {
      const throwsText: ValidatorFn<any> = () => {
        throw 'not an error object';
      };
      const state = drive(
        [init({ form: [emailInput] }), setData({ email: 'a@b.c' }), validateAllAction],
        'eager',
        throwsText,
      );

      expect((state.formHealth as { message: string }).message).toContain('not an error object');
    });

    it('names the first failing input and keeps the first message', () => {
      let calls = 0;
      const failsOnlyTheFirstTime: ValidatorFn<any> = (validator, localization) => {
        calls += 1;
        if (calls === 2) {
          throw new Error('the first failure');
        }
        return (validators as ValidatorFn<any>)(validator, localization);
      };
      const reduce = makeReducer('eager', failsOnlyTheFirstTime);
      const actions: Action[] = [
        init({ form: [nameInput, emailInput] }),
        setData({ name: 'Ada', email: 'a@b.c' }),
        validateAllAction,
      ];
      const failed = actions.reduce(reduce, createInitialState('en-US'));

      expect((failed.formHealth as { message: string }).message).toContain('"email"');
      expect((failed.formHealth as { message: string }).message).toContain('the first failure');

      // The validator now works, but the health stays until the app clears it.
      const validatedAgain = reduce(failed, validateAllAction);

      expect(validatedAgain.formHealth).toBe(failed.formHealth);
      expect(validatedAgain.isFormValid).toBe(false);
    });

    it('stops the derive after the failure', () => {
      const reduce = makeReducer('eager', validatorsThrowing);
      const stateExpressionForm = {
        form: [
          emailInput,
          { uid: 'info', kind: 'display', type: 'text', include: { when: '$form.email === "x"' } },
        ],
      };
      const failed = [
        init(stateExpressionForm),
        setData({ email: 'a@b.c' }),
        validateAllAction,
      ].reduce(reduce, createInitialState('en-US'));
      const afterTyping = reduce(failed, setWidgetData('email', 'x'));

      expect(afterTyping.data).toEqual({ email: 'x' });
      expect(afterTyping.widgetFlags).toBe(failed.widgetFlags);
      expect(afterTyping.formHealth).toBe(failed.formHealth);
    });

    it('validates again after the app clears the health', () => {
      let isBroken = true;
      const failsWhileBroken: ValidatorFn<any> = (validator, localization) => {
        if (isBroken) {
          throw new Error('broken');
        }
        return (validators as ValidatorFn<any>)(validator, localization);
      };
      const reduce = makeReducer('eager', failsWhileBroken);
      const failed = [
        init({ form: [emailInput] }),
        setData({ email: 'a@b.c' }),
        validateAllAction,
      ].reduce(reduce, createInitialState('en-US'));
      expect(failed.isFormValid).toBe(false);

      isBroken = false;
      const cleared = reduce(failed, {
        type: 'SET_FORM_HEALTH',
        payload: { formHealth: { status: 'ok' } },
      });
      const validated = reduce(cleared, validateAllAction);

      expect(validated.formHealth).toEqual({ status: 'ok' });
      expect(validated.isFormValid).toBe(true);
    });

    it('keeps health ok and the form valid when the validators work', () => {
      const state = drive([
        init({ form: [emailInput] }),
        setData({ email: 'a@b.c' }),
        validateAllAction,
      ]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.isFormValid).toBe(true);
    });
  });

  describe('forbidden path segments', () => {
    afterEach(() => {
      delete (Object.prototype as any).isAdminE2E;
    });

    it('rejects an input of a repeater template with a forbidden path', () => {
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
                children: [{ uid: 'name', kind: 'input', type: 'text', path: '__proto__.name' }],
              },
            },
          },
        ],
      };

      const state = drive([init(formDef), setData({ users: [{}] })]);

      expect(state.formHealth).toMatchObject({
        status: 'errored',
        code: errorCodes.initializeUnknownError,
      });
      expect((state.formHealth as { message: string }).message).toContain(
        'props.template.children[0].path: Path "__proto__.name" has the segment "__proto__"',
      );
    });

    it('errors the props pass for a prop named __proto__', () => {
      // JSON.parse keeps `__proto__` as an own key, so the props pass reads it as a prop name.
      // Without the guard, its write replaced the prototype of the resolved props object.
      const formDef = JSON.parse(
        '{ "form": [{ "uid": "title", "kind": "display", "type": "heading", "props": { "__proto__": { "isAdminE2E": true } } }] }',
      );

      const state = drive([init(formDef), setData({})]);

      expect(state.formHealth).toMatchObject({ status: 'errored', code: 12 });
      if (state.formHealth.status === 'errored') {
        expect(state.formHealth.message).toContain(
          'Path "props.__proto__" has the segment "__proto__"',
        );
      }
    });

    it('throws from SET_WIDGET_DATA for a forbidden path and leaves Object.prototype unchanged', () => {
      const reduce = makeReducer();
      const state = drive([init(makeBaseFormDef())]);

      expect(() => reduce(state, setWidgetData('__proto__.isAdminE2E', true))).toThrow(
        'has the segment "__proto__"',
      );
      expect(({} as any).isAdminE2E).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 30. Hidden rows of a repeater of plain values
  // ---------------------------------------------------------------------------

  // formSubmit and formEvent data both come from `pruneHiddenData`. A hidden row leaves an empty
  // slot at its index, so a row index names the same row in the pruned data. `toEqual` reads an
  // empty slot as `undefined`, and `Object.keys` lists the indexes that hold a value.
  describe('hidden rows of a repeater of plain values', () => {
    it('keeps each visible row at its index when two rows are hidden', () => {
      const state = drive([
        init(makePlainRowsFormDef()),
        setData({ tags: ['a', 'hidden', 'hidden', 'd'] }),
      ]);

      expect(state.widgetFlags['tag[1]']).toEqual({ hidden: true });
      expect(state.widgetFlags['tag[2]']).toEqual({ hidden: true });
      const pruned = pruneHiddenData(state);
      expect(pruned).toEqual({ tags: ['a', undefined, undefined, 'd'] });
      expect(Object.keys(pruned['tags'])).toEqual(['0', '3']);
      expect(state.data['tags']).toEqual(['a', 'hidden', 'hidden', 'd']);
    });

    it('keeps the array length when every row is hidden', () => {
      const state = drive([init(makePlainRowsFormDef()), setData({ tags: ['hidden', 'hidden'] })]);

      const pruned = pruneHiddenData(state);
      expect(pruned['tags']).toHaveLength(2);
      expect(Object.keys(pruned['tags'])).toEqual([]);
    });

    it('keeps the positions of hidden plain values inside object rows', () => {
      const state = drive([
        init(makeNestedPlainRowsFormDef()),
        setData({
          groups: [{ tags: ['hidden', 'b', 'hidden', 'd'] }, { tags: ['e', 'hidden', 'g'] }],
        }),
      ]);

      const pruned = pruneHiddenData(state);
      expect(pruned).toEqual({
        groups: [{ tags: [undefined, 'b', undefined, 'd'] }, { tags: ['e', undefined, 'g'] }],
      });
      expect(Object.keys(pruned['groups'][0].tags)).toEqual(['1', '3']);
      expect(Object.keys(pruned['groups'][1].tags)).toEqual(['0', '2']);
    });

    it('keeps the positions of a hidden outer row and of hidden inner rows', () => {
      const state = drive([
        init(makePlainMatrixFormDef()),
        setData({ matrix: [['a', 'hidden', 'c'], ['d'], ['hidden', 'f']] }),
      ]);

      expect(state.widgetFlags['cells[1]']).toEqual({ hidden: true });
      const pruned = pruneHiddenData(state);
      expect(pruned).toEqual({ matrix: [['a', undefined, 'c'], undefined, [undefined, 'f']] });
      expect(Object.keys(pruned['matrix'])).toEqual(['0', '2']);
      expect(Object.keys(pruned['matrix'][0])).toEqual(['0', '2']);
      expect(Object.keys(pruned['matrix'][2])).toEqual(['1']);
    });

    it('keeps each object row at its index when the fields of two rows are hidden', () => {
      const state = drive([
        init(makeRowScopeFormDef()),
        setData({
          lineItems: [
            { quantity: 1, active: false },
            { quantity: 2, active: false },
            { quantity: 3, active: true },
          ],
        }),
      ]);

      expect(pruneHiddenData(state)).toStrictEqual({
        lineItems: [{ active: false }, { active: false }, { quantity: 3, active: true }],
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 31. The order of the derive passes
  // ---------------------------------------------------------------------------

  // One derive writes the defaults, drops the entries of removed rows, builds the validation
  // variables, and then runs the states, flags and props passes, in this order.
  describe('the order of the derive passes', () => {
    const makeNamedFormDef = () => ({
      states: { named: "$form.firstName === 'Anon'" },
      form: [
        {
          uid: 'firstName',
          kind: 'input',
          type: 'textinput',
          path: 'firstName',
          defaultValue: 'Anon',
        },
        {
          uid: 'anonNote',
          kind: 'display',
          type: 'heading',
          include: { when: "$form.firstName === 'Anon'" },
        },
      ],
    });

    it('activates a state that reads a default written in the same derive', () => {
      const state = drive([init(makeNamedFormDef()), setData({})]);

      expect(state.data).toEqual({ firstName: 'Anon' });
      expect(state.currentStates).toEqual(['named']);
    });

    it('shows a widget whose when reads a default written in the same derive', () => {
      const state = drive([init(makeNamedFormDef()), setData({})]);

      expect(state.widgetFlags['anonNote']).toEqual({ hidden: false });
      expect(state.calculatedWidgets).toHaveProperty('anonNote');
    });

    it('drops the validation of a removed row before $formIsInvalid is computed', () => {
      const formDef = {
        form: [
          {
            uid: 'invalidNote',
            kind: 'display',
            type: 'heading',
            include: { when: '$formIsInvalid' },
          },
          ...makeRequiredRowsFormDef().form,
        ],
      };
      const twoRows = drive([
        init(formDef),
        setData({ users: [{ name: 'Ada' }, {}] }),
        validateAllAction,
      ]);
      expect(twoRows.validations['users.1.name']).toEqual(['required']);
      expect(twoRows.widgetFlags['invalidNote']).toEqual({ hidden: false });

      const reduce = makeReducer();
      const oneRow = reduce(twoRows, setData({ users: [{ name: 'Ada' }] }));

      expect(oneRow.validations).not.toHaveProperty('users.1.name');
      expect(oneRow.widgetFlags['invalidNote']).toEqual({ hidden: true });
      expect(oneRow.calculatedWidgets).not.toHaveProperty('invalidNote');
    });
  });

  // ---------------------------------------------------------------------------
  // 32. Error codes of INITIALIZE and of the states pass
  // ---------------------------------------------------------------------------

  describe('error codes of INITIALIZE and of the states pass', () => {
    const initFromString = (formDef: string): Action => ({
      type: 'INITIALIZE',
      payload: { formName: 'test-form', formDef },
    });

    it('reports code 20 with the JSON.parse message for a form definition that is not JSON', () => {
      const badJson = '{ bad';
      let parseMessage = '';
      try {
        JSON.parse(badJson);
      } catch (error) {
        parseMessage = (error as Error).message;
      }

      const state = drive([initFromString(badJson)]);

      expect(parseMessage).not.toBe('');
      expect(state.formHealth).toEqual({
        status: 'errored',
        message: `[20] ${parseMessage}`,
        code: 20,
      });
      expect(state.flatForm).toEqual({});
    });

    it('decodes a form definition given as a JSON string', () => {
      const formDef = JSON.stringify({
        form: [{ uid: 'firstName', kind: 'input', type: 'textinput', path: 'firstName' }],
      });

      const state = drive([initFromString(formDef), setData({})]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.flatForm).toHaveProperty('firstName');
      expect(state.calculatedWidgets).toHaveProperty('firstName');
    });

    it('reports code 22 with the issue path for an unknown widget kind', () => {
      const state = drive([init({ form: [{ uid: 'name', kind: 'unknown' }] })]);

      expect(state.formHealth).toEqual({
        status: 'errored',
        message:
          '[22] form.children[0].kind: "kind" must be one of "input", "layout", "display", "action", but got "unknown"',
        code: 22,
      });
    });

    it('labels an issue of the whole form definition as root', () => {
      const state = drive([initFromString('"form"')]);

      expect(state.formHealth).toEqual({
        status: 'errored',
        message: '[22] root: "form" is not a valid object',
        code: 22,
      });
    });

    it('treats a state expression that throws as an inactive state, not as code 10', () => {
      const formDef = {
        states: { broken: '$form.missing.deep === 1', always: 'true' },
        form: [
          { uid: 'brokenOnly', kind: 'display', type: 'heading', include: { in: ['broken'] } },
        ],
      };

      const state = drive([init(formDef), setData({})]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.currentStates).toEqual(['always']);
      expect(state.widgetFlags['brokenOnly']).toEqual({ hidden: true });
    });
  });

  describe('a language change and the validation messages', () => {
    const requiredMessage: Record<string, string> = {
      'en-US': 'This field is required',
      'es-ES': 'Este campo es obligatorio',
    };

    // A validator fails while this flag is set. The flag is shared by the tests of this describe.
    let validatorsBroken = false;
    let consoleError: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      validatorsBroken = false;
      consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
      consoleError.mockRestore();
    });

    /** Answers in the language it was last set to, like a real i18n adapter. */
    const makeTranslator = () => {
      let lang = 'en-US';
      return {
        get lang() {
          return lang;
        },
        translate: (key: string) => (key === 'required' ? requiredMessage[lang] : key),
        subscribe: () => () => undefined,
        setLang: (newLang: string) => {
          lang = newLang;
        },
      };
    };

    /** Like the validators of the gui package, the message is translated when the validator runs. */
    const translatingValidators: ValidatorFn<TestValidator> = (validator, localization) => {
      if (validatorsBroken) {
        throw new Error('the validator failed');
      }
      return {
        '~standard': {
          version: 1,
          vendor: 'reducer-spec',
          validate: (value: unknown) => {
            const isEmpty = value === undefined || value === null || value === '';
            return validator?.required && isEmpty
              ? { issues: [{ message: localization?.translate('required') ?? 'required' }] }
              : { value };
          },
        },
      };
    };

    const makeForm = () => {
      const translator = makeTranslator();
      const reduce = reducer({
        validators: translatingValidators as ValidatorFn<any>,
        validateOn: 'eager',
        localization: translator,
        functions,
      });
      // The bindings do the same: the translator changes first, then SET_LANGUAGE reaches the store.
      const changeLanguage = (state: State, lang: string): State => {
        translator.setLang(lang);
        return reduce(state, { type: 'SET_LANGUAGE', payload: { lang } });
      };
      return { reduce, changeLanguage };
    };

    const formDef = {
      form: [
        { uid: 'email', kind: 'input', type: 'text', path: 'email', validator: { required: true } },
        {
          uid: 'emailError',
          kind: 'display',
          type: 'heading',
          props: { text: '{{$errors.email}}' },
        },
      ],
    };

    it('translates the shown error and $errors to the new language', () => {
      const { reduce, changeLanguage } = makeForm();
      const shown = [init(formDef), setData({}), blur('email', 'email')].reduce(
        reduce,
        createInitialState('en-US'),
      );
      expect(shown.validations).toEqual({ email: [requiredMessage['en-US']] });
      expect(propsOf(shown, 'emailError')['text']).toBe(requiredMessage['en-US']);

      const spanish = changeLanguage(shown, 'es-ES');

      expect(spanish.validations).toEqual({ email: [requiredMessage['es-ES']] });
      expect(propsOf(spanish, 'emailError')['text']).toBe(requiredMessage['es-ES']);
      expect(spanish.isFormValid).toBe(false);
      expect(spanish.touchedControls).toBe(shown.touchedControls);
    });

    it('does not create an error for an input that was not validated yet', () => {
      const { reduce, changeLanguage } = makeForm();
      const before = [init(formDef), setData({})].reduce(reduce, createInitialState('en-US'));

      const after = changeLanguage(before, 'es-ES');

      expect(after.validations).toEqual({});
      expect(after.isFormValid).toBe(true);

      // Control: the validator does answer in the new language once the input is validated.
      const validated = reduce(after, blur('email', 'email'));
      expect(validated.validations).toEqual({ email: [requiredMessage['es-ES']] });
    });

    it('gives the form health code 60 when a validator fails on the language change', () => {
      const { reduce, changeLanguage } = makeForm();
      const shown = [init(formDef), setData({}), blur('email', 'email')].reduce(
        reduce,
        createInitialState('en-US'),
      );
      expect(shown.formHealth).toEqual({ status: 'ok' });

      validatorsBroken = true;
      const failed = changeLanguage(shown, 'es-ES');

      expect(failed.formHealth).toMatchObject({
        status: 'errored',
        code: errorCodes.validationError,
      });
      expect(failed.isFormValid).toBe(false);
    });

    it('keeps the health of a failed validator when the props pass fails on the language change', () => {
      let functionBroken = false;
      const translator = makeTranslator();
      const reduce = reducer({
        validators: translatingValidators as ValidatorFn<any>,
        validateOn: 'eager',
        localization: translator,
        functions: {
          ...functions,
          label: () => {
            if (functionBroken) {
              throw new Error('the function failed');
            }
            return 'label';
          },
        },
      });
      const failedValidator = [
        init({
          form: [
            ...formDef.form,
            { uid: 'title', kind: 'display', type: 'heading', props: { text: '{{$fn.label()}}' } },
          ],
        }),
        setData({}),
        blur('email', 'email'),
      ].reduce(reduce, createInitialState('en-US'));
      validatorsBroken = true;
      const failed = reduce(failedValidator, validateAllAction);
      expect(failed.formHealth).toMatchObject({ code: errorCodes.validationError });

      functionBroken = true;
      translator.setLang('es-ES');
      const after = reduce(failed, { type: 'SET_LANGUAGE', payload: { lang: 'es-ES' } });

      expect(after.formHealth).toBe(failed.formHealth);
      expect(after.isFormValid).toBe(false);
    });
  });

  describe('INITIALIZE on a form that already has state', () => {
    it('resets meta, injected issues, overrides and the submit flags, and keeps the language', () => {
      const used = drive([
        init(makeBaseFormDef()),
        setData({ users: [] }),
        { type: 'SET_META', payload: { meta: { mode: 'dev' } } },
        validateAllAction,
        { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'firstName', issues: ['taken'] } },
        {
          type: 'OVERRIDE_WIDGET_PROP',
          payload: { uid: 'firstName', prop: 'placeholder', value: 'Name' },
        },
        { type: 'SET_LANGUAGE', payload: { lang: 'fr-FR' } },
      ]);
      expect(used.meta).toEqual({ mode: 'dev' });
      expect(used.injectedValidations).toEqual({ firstName: ['taken'] });
      expect(used.widgetPropOverrides).toEqual({ firstName: { placeholder: 'Name' } });
      expect(used.allControlsValidated).toBe(true);
      expect(used.isFormValid).toBe(false);
      expect(used.touched).toBe(true);
      expect(used.touchedControls).toEqual({ firstName: true, users: true });
      expect(used.validations).toEqual({ firstName: ['required'], users: null });

      const reduce = makeReducer();
      const state = reduce(used, {
        type: 'INITIALIZE',
        payload: { formName: 'second-form', formDef: makeBaseFormDef() },
      });

      expect(state.meta).toEqual({});
      expect(state.injectedValidations).toEqual({});
      expect(state.widgetPropOverrides).toEqual({});
      expect(state.allControlsValidated).toBe(false);
      expect(state.isFormValid).toBe(true);
      expect(state.touched).toBe(false);
      expect(state.touchedControls).toEqual({});
      expect(state.validations).toEqual({});
      expect(state.lang).toBe('fr-FR');
      expect(state.formName).toBe('second-form');
    });

    it('clears an error set outside the derive, so the next SET_DATA computes the form', () => {
      const frozen = drive([
        init(makeBaseFormDef()),
        setData({}),
        {
          type: 'SET_FORM_HEALTH',
          payload: { formHealth: { status: 'errored', code: 30, message: '[30] no widget' } },
        },
      ]);
      expect(frozen.formHealth.status).toBe('errored');

      const reduce = makeReducer();
      const initialized = reduce(frozen, init(makeBaseFormDef()));
      expect(initialized.formHealth).toEqual({ status: 'ok' });

      const state = reduce(initialized, setData({ age: 21 }));
      expect(state.currentStates).toEqual(['adult']);
      expect(state.calculatedWidgets).toHaveProperty('bio');
    });

    it('keeps and submits the data of a removed input when the host sets the old data again', () => {
      const firstName = { uid: 'firstName', kind: 'input', type: 'textinput', path: 'firstName' };
      const nickname = { uid: 'nickname', kind: 'input', type: 'textinput', path: 'nickname' };
      const oldData = { firstName: 'Joan', nickname: 'J' };
      const before = drive([init({ form: [firstName, nickname] }), setData(oldData)]);

      const reduce = makeReducer();
      const replaced = reduce(before, init({ form: [{ ...firstName }] }));
      const state = reduce(replaced, setData(before.data));

      expect(state.flatForm).not.toHaveProperty('nickname');
      expect(state.data).toEqual(oldData);
      expect(pruneHiddenData(state)).toEqual(oldData);
    });
  });

  describe('function widget failures', () => {
    it('reports code 11 when a function widget throws in the flags call, and recovers', () => {
      const notes: FunctionWidget<string> = (api) => {
        if (api?.$form?.['explode']) {
          throw new Error('flags failed');
        }
        return { uid: 'notes', kind: 'input', type: 'textinput', path: 'notes' } as InputWidget<
          any,
          string
        >;
      };
      notes.uid = 'notes';
      const ok = drive([init({ form: [notes] }), setData({})]);
      expect(ok.formHealth).toEqual({ status: 'ok' });

      const reduce = makeReducer();
      const state = reduce(ok, setData({ explode: true }));

      expect(state.formHealth).toEqual({
        status: 'errored',
        message: '[11] flags failed',
        code: 11,
      });
      expect(reduce(state, setData({})).formHealth).toEqual({ status: 'ok' });
    });

    it('reports code 12 when a function widget throws only in the props call, and recovers', () => {
      const notes: FunctionWidget<string> = (api) => {
        // Only the props call passes a translate function.
        if (api?.$form?.['explode'] && api.translate !== undefined) {
          throw new Error('props failed');
        }
        return { uid: 'notes', kind: 'input', type: 'textinput', path: 'notes' } as InputWidget<
          any,
          string
        >;
      };
      notes.uid = 'notes';
      const ok = drive([init({ form: [notes] }), setData({})]);
      expect(ok.formHealth).toEqual({ status: 'ok' });

      const reduce = makeReducer();
      const state = reduce(ok, setData({ explode: true }));

      expect(state.formHealth).toEqual({
        status: 'errored',
        message: '[12] props failed',
        code: 12,
      });
      expect(reduce(state, setData({})).formHealth).toEqual({ status: 'ok' });
    });
  });

  describe('injected issues and the derive', () => {
    it('drops an injected issue on a path no input owns at the next derive', () => {
      const injected = drive([
        init(makeValidationDrivenFormDef()),
        setData({ firstName: 'Joan' }),
        { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'ghost', issues: ['unknown'] } },
        { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'firstName', issues: ['taken'] } },
      ]);
      expect(injected.injectedValidations).toEqual({ ghost: ['unknown'], firstName: ['taken'] });

      const reduce = makeReducer();
      const state = reduce(injected, setData({ firstName: 'Ada' }));

      expect(state.injectedValidations).toEqual({ firstName: ['taken'] });
    });
  });

  describe('validateOn modes', () => {
    const change = (path: string, uid: string): Action => ({
      type: 'ATTEMPT_VALIDATION',
      payload: { reason: 'change', path, uid },
    });

    it("'submit' ignores blur and change, and VALIDATE_ALL still validates", () => {
      const initial = drive([init(makeBaseFormDef()), setData({})], 'submit');
      const reduce = makeReducer('submit');

      expect(reduce(initial, blur('firstName', 'firstName'))).toBe(initial);
      expect(reduce(initial, change('firstName', 'firstName'))).toBe(initial);

      const submitted = reduce(initial, validateAllAction);
      expect(submitted.validations).toEqual({ firstName: ['required'], users: null });
    });

    it("['change', 'blur'] validates on a change and on a blur", () => {
      const initial = drive([init(makeBaseFormDef()), setData({})], ['change', 'blur']);
      const reduce = makeReducer(['change', 'blur']);

      const onChange = reduce(initial, change('firstName', 'firstName'));
      const onBlur = reduce(initial, blur('firstName', 'firstName'));

      expect(onChange.validations).toEqual({ firstName: ['required'], users: null });
      expect(onBlur.validations).toEqual({ firstName: ['required'], users: null });
    });

    it("['blur'] ignores a change and validates on a blur", () => {
      const initial = drive([init(makeBaseFormDef()), setData({})], ['blur']);
      const reduce = makeReducer(['blur']);

      expect(reduce(initial, change('firstName', 'firstName'))).toBe(initial);

      const onBlur = reduce(initial, blur('firstName', 'firstName'));
      expect(onBlur.validations).toEqual({ firstName: ['required'], users: null });
    });
  });

  describe('overrides addressed by path', () => {
    /** Two inputs on the path 'x'. The first one is always hidden. */
    const makeSharedPathFormDef = (secondHidden: boolean) => ({
      form: [
        { uid: 'first', kind: 'input', type: 'textinput', path: 'x', include: { when: 'false' } },
        {
          uid: 'second',
          kind: 'input',
          type: 'textinput',
          path: 'x',
          include: { when: secondHidden ? 'false' : 'true' },
        },
      ],
    });

    it('stores the override under the visible input when a hidden input owns the same path', () => {
      const state = drive([
        init(makeSharedPathFormDef(false)),
        setData({}),
        overrideByPath('x', 'Shared'),
      ]);

      expect(state.widgetFlags['first']).toEqual({ hidden: true });
      expect(state.widgetPropOverrides).toEqual({ second: { placeholder: 'Shared' } });
      expect(propsOf(state, 'second')['placeholder']).toBe('Shared');
    });

    it('stores the override under the first input of the form when every owner is hidden', () => {
      const state = drive([
        init(makeSharedPathFormDef(true)),
        setData({}),
        overrideByPath('x', 'Shared'),
      ]);

      expect(state.widgetPropOverrides).toEqual({ first: { placeholder: 'Shared' } });
    });

    it('stores the override of a row path under the uid of that row', () => {
      const state = drive([
        init(makeBaseFormDef()),
        setData({ users: [{ name: 'Ada' }, { name: 'Bob' }] }),
        overrideByPath('users.1.name', 'Second'),
      ]);

      expect(state.widgetPropOverrides).toEqual({ 'name[1]': { placeholder: 'Second' } });
      expect(propsOf(state, 'name[1]')['placeholder']).toBe('Second');
      expect(propsOf(state, 'name[0]')['placeholder']).toBeUndefined();
    });

    it('keeps the key of an override set to undefined and shows the source value again', () => {
      const formDef = {
        form: [
          {
            uid: 'firstName',
            kind: 'input',
            type: 'textinput',
            path: 'firstName',
            props: { placeholder: 'Source' },
          },
        ],
      };
      const overridden = drive([init(formDef), setData({}), overrideByPath('firstName', 'Over')]);
      expect(propsOf(overridden, 'firstName')['placeholder']).toBe('Over');

      const reduce = makeReducer();
      const state = reduce(overridden, overrideByPath('firstName', undefined));

      expect('placeholder' in state.widgetPropOverrides['firstName']).toBe(true);
      expect(state.widgetPropOverrides['firstName']['placeholder']).toBeUndefined();
      expect(propsOf(state, 'firstName')['placeholder']).toBe('Source');
    });

    it('validates again on a touched form only when the addressed input is touched', () => {
      const formDef = {
        form: [
          { uid: 'a', kind: 'input', type: 'textinput', path: 'a', validator: { required: true } },
          { uid: 'b', kind: 'input', type: 'textinput', path: 'b', validator: { required: true } },
        ],
      };
      // Both validations are stale: a data write does not validate again.
      const before = drive([
        init(formDef),
        setData({}),
        blur('a', 'a'),
        setWidgetData('a', 'filled'),
        setWidgetData('b', 'filled'),
      ]);
      expect(before.touched).toBe(true);
      expect(before.touchedControls).toEqual({ a: true });
      expect(before.validations).toEqual({ a: ['required'], b: ['required'] });

      const reduce = makeReducer();
      const untouchedTarget = reduce(before, overrideByPath('b', 'B'));
      const touchedTarget = reduce(before, overrideByPath('a', 'A'));

      expect(untouchedTarget.validations).toEqual({ a: ['required'], b: ['required'] });
      expect(touchedTarget.validations['a']).toBeNull();
    });
  });

  describe('function widget calls', () => {
    // The call arguments are compared with toStrictEqual, so a key that holds undefined must be
    // there, and a missing key must be missing.

    /** A function widget that records its calls. It owns the path 'notes'. */
    const makeRecordedWidget = (returned: Record<string, unknown> = {}) =>
      vi.fn<FunctionWidget<string>>(
        () =>
          ({
            uid: 'notes',
            kind: 'input',
            type: 'textinput',
            path: 'notes',
            ...returned,
          }) as InputWidget<any, string>,
      );

    it('INITIALIZE calls it once with empty data and without errors, touched or translate', () => {
      const notes = makeRecordedWidget();

      const state = drive([init({ form: [notes] })]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(notes).toHaveBeenCalledTimes(1);
      expect(notes.mock.calls[0][0]).toStrictEqual({
        $form: {},
        errors: undefined,
        touched: undefined,
        translate: undefined,
      });
    });

    it('SET_DATA calls it twice, first for the flags without translate, then for the props', () => {
      const notes = makeRecordedWidget();
      const initialized = drive([init({ form: [notes] })]);
      notes.mockClear();

      const reduce = makeReducer();
      const state = reduce(initialized, setData({ notes: 'a' }));

      expect(notes).toHaveBeenCalledTimes(2);
      expect(notes.mock.calls[0][0]).toStrictEqual({
        $form: { notes: 'a' },
        $item: undefined,
        $index: undefined,
        errors: undefined,
        touched: undefined,
        translate: undefined,
      });
      expect(notes.mock.calls[1][0]).toStrictEqual({
        $form: { notes: 'a' },
        $item: undefined,
        $index: undefined,
        errors: undefined,
        touched: undefined,
        translate: expect.any(Function),
      });

      notes.mockClear();
      reduce(state, setData({ notes: 'b' }));

      expect(notes).toHaveBeenCalledTimes(2);
    });

    it('a blur passes errors and touched to the props call only', () => {
      const notes = makeRecordedWidget({ validator: { required: true } });
      const initial = drive([init({ form: [notes] }), setData({ notes: '' })]);
      notes.mockClear();

      const reduce = makeReducer();
      reduce(initial, blur('notes', 'notes'));

      expect(notes).toHaveBeenCalledTimes(2);
      expect(notes.mock.calls[0][0]).toStrictEqual({
        $form: { notes: '' },
        $item: undefined,
        $index: undefined,
        errors: undefined,
        touched: undefined,
        translate: undefined,
      });
      expect(notes.mock.calls[1][0]).toStrictEqual({
        $form: { notes: '' },
        $item: undefined,
        $index: undefined,
        errors: ['required'],
        touched: true,
        translate: expect.any(Function),
      });
    });

    it('calls a hidden function widget for its flags only', () => {
      const notes = makeRecordedWidget({ include: { when: '$form.show === true' } });
      const initialized = drive([init({ form: [notes] })]);
      const reduce = makeReducer();

      notes.mockClear();
      const hidden = reduce(initialized, setData({ show: false }));

      expect(hidden.calculatedWidgets).not.toHaveProperty('notes');
      expect(notes).toHaveBeenCalledTimes(1);
      expect(notes.mock.calls[0][0]?.translate).toBeUndefined();

      notes.mockClear();
      const visible = reduce(hidden, setData({ show: true }));

      expect(visible.calculatedWidgets).toHaveProperty('notes');
      expect(notes).toHaveBeenCalledTimes(2);
    });

    it('calls a row function widget once more per row, to find a nested repeater', () => {
      const rowName = vi.fn<FunctionWidget<string>>(
        () =>
          ({
            uid: 'rowName',
            kind: 'input',
            type: 'textinput',
            path: 'users.items.name',
          }) as InputWidget<any, string>,
      );
      const formDef = {
        form: [
          {
            uid: 'users',
            kind: 'input',
            type: 'repeater',
            path: 'users',
            props: {
              template: { uid: 'usersRow', kind: 'layout', type: 'flex', children: [rowName] },
            },
          },
        ],
      };
      const initialized = drive([init(formDef)]);
      expect(rowName).toHaveBeenCalledTimes(1);
      rowName.mockClear();

      const reduce = makeReducer();
      const data = { users: [{ name: 'Ada' }, { name: 'Bob' }] };
      reduce(initialized, setData(data));

      const rowCall = (index: number, translate: unknown) => ({
        $form: data,
        $item: data.users[index],
        $index: index,
        errors: undefined,
        touched: undefined,
        translate,
      });
      expect(rowName).toHaveBeenCalledTimes(6);
      // The row expansion.
      expect(rowName.mock.calls[0][0]).toStrictEqual(rowCall(0, undefined));
      expect(rowName.mock.calls[1][0]).toStrictEqual(rowCall(1, undefined));
      // The flags.
      expect(rowName.mock.calls[2][0]).toStrictEqual(rowCall(0, undefined));
      expect(rowName.mock.calls[3][0]).toStrictEqual(rowCall(1, undefined));
      // The props.
      expect(rowName.mock.calls[4][0]).toStrictEqual(rowCall(0, expect.any(Function)));
      expect(rowName.mock.calls[5][0]).toStrictEqual(rowCall(1, expect.any(Function)));
    });

    it('reports code 21 when the same function object is used twice in one form', () => {
      const notes: FunctionWidget<string> = () =>
        ({ kind: 'input', type: 'textinput', path: 'notes' }) as InputWidget<any, string>;

      const state = drive([init({ form: [notes, notes] })]);

      expect(state.formHealth).toEqual({
        status: 'errored',
        message: '[21] Duplicate UID "#0.0.f": Assigned to widget "textinput" and "textinput".',
        code: 21,
      });
    });

    // The path is the key of the input's data, touched flag, errors and overrides, so it is read
    // once, when the form is decoded.
    it('keeps the path of the decode call when the function returns another path later', () => {
      let returnedPath = 'first';
      const notes: FunctionWidget<string> = () =>
        ({
          uid: 'notes',
          kind: 'input',
          type: 'textinput',
          path: returnedPath,
          validator: { required: true },
        }) as InputWidget<any, string>;
      const initialized = drive([init({ form: [notes] })]);

      returnedPath = 'second';
      const reduce = makeReducer();
      const state = reduce(initialized, setData({ first: 'a', second: 'b' }));
      const validated = reduce(state, validateAllAction);

      expect((state.calculatedWidgets['notes'].current as InputWidget<any, string>).path).toBe(
        'first',
      );
      expect(validated.touchedControls).toEqual({ first: true });
      expect(validated.validations).toEqual({ first: null });
    });
  });

  describe('which suffixed value a widget uses when several states are active', () => {
    const makeLabelFormDef = (states: Record<string, string>) => ({
      states,
      form: [
        {
          uid: 'save',
          kind: 'action',
          type: 'button',
          label: 'base',
          'label.aa': 'AA',
          'label.bb': 'BB',
          'label.c': 'C',
          'label.long': 'LONG',
          'label.register': 'REGISTER',
          'label.register:adult': 'REGISTER_ADULT',
        },
      ],
    });

    const labelOf = (state: State) =>
      (state.calculatedWidgets['save'].current as ActionWidget<string>).label;

    it('uses the base value when no declared state is active', () => {
      const state = drive([init(makeLabelFormDef({ bb: 'false' })), setData({})]);

      expect(state.currentStates).toEqual([]);
      expect(labelOf(state)).toBe('base');
    });

    it('uses the value of the child state when a parent and its child are active', () => {
      const state = drive([
        init(makeLabelFormDef({ register: 'true', 'register:adult': '$form.age >= 18' })),
        setData({ age: 20 }),
      ]);

      expect(state.currentStates).toEqual(['register', 'register:adult']);
      expect(labelOf(state)).toBe('REGISTER_ADULT');
    });

    it('uses the value of the parent state when its child state is not active', () => {
      const state = drive([
        init(makeLabelFormDef({ register: 'true', 'register:adult': '$form.age >= 18' })),
        setData({ age: 10 }),
      ]);

      expect(state.currentStates).toEqual(['register']);
      expect(labelOf(state)).toBe('REGISTER');
    });

    it('uses the state with the longest name when unrelated states are active', () => {
      const state = drive([init(makeLabelFormDef({ c: 'true', long: 'true' })), setData({})]);

      expect(state.currentStates).toEqual(['c', 'long']);
      expect(labelOf(state)).toBe('LONG');
    });

    it('uses the state declared first when two active states have names of the same length', () => {
      const bbFirst = drive([
        init(makeLabelFormDef({ bb: 'true', aa: 'true', c: 'true' })),
        setData({}),
      ]);
      expect(bbFirst.currentStates).toEqual(['bb', 'aa', 'c']);
      expect(labelOf(bbFirst)).toBe('BB');

      const aaFirst = drive([
        init(makeLabelFormDef({ aa: 'true', bb: 'true', c: 'true' })),
        setData({}),
      ]);
      expect(aaFirst.currentStates).toEqual(['aa', 'bb', 'c']);
      expect(labelOf(aaFirst)).toBe('AA');
    });
  });
});
