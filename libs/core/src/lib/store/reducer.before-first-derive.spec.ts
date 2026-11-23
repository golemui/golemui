import { type StandardSchemaV1 } from '@standard-schema/spec';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { identityTranslator } from '../i18n';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';
import { widgetViewModel } from './view-model';

/**
 * What the actions do between `INITIALIZE` and the first `SET_DATA`, checked through the reducer.
 * `INITIALIZE` computes no widget. At this point the state holds the widgets outside a repeater,
 * and no repeater row. Each test sends `INITIALIZE`, then other actions, and reads the state that
 * results or the view model of one widget.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.before-first-derive.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

/** Only `required` is supported: an empty value gives the message `required`. */
type TestValidator = { required?: boolean };

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

const reduce = reducer({
  validators: validators as ValidatorFn<any>,
  validateOn: 'eager',
  localization: identityTranslator('en-US'),
  functions: {},
});

/** Dispatches the actions from a new initial state and returns the last state. */
const drive = (actions: Action[]): State => actions.reduce(reduce, createInitialState('en-US'));

const init = (formDef: Record<string, any>): Action => ({
  type: 'INITIALIZE',
  payload: { formName: 'test-form', formDef },
});

const setData = (data: Record<string, any>): Action => ({
  type: 'SET_DATA',
  payload: { data },
});

const validateAllAction: Action = { type: 'VALIDATE_ALL' };

const inject = (path: string, issues: string[]): Action => ({
  type: 'INJECT_VALIDATION_ISSUES',
  payload: { path, issues },
});

const overrideByPath = (path: string, value: unknown): Action => ({
  type: 'OVERRIDE_WIDGET_PROP',
  payload: { path, prop: 'placeholder', value },
});

/**
 * A required input, a display that the state `adult` shows, and a repeater whose row holds a
 * required input. Without `age` in the data, the first derive hides the display. The uid of the
 * first input is not its path, so a test can tell the two.
 */
const makeFormDef = () => ({
  states: { adult: '$form.age >= 18' },
  form: [
    {
      uid: 'firstNameInput',
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

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('reducer: actions before the first SET_DATA', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('touches only the input of a new row when the first data comes after a submit attempt', () => {
    const submitted = drive([init(makeFormDef()), validateAllAction]);
    // No widget was computed when the submit attempt touched the inputs.
    expect(submitted.allControlsValidated).toBe(true);
    expect(submitted.touchedControls).toEqual({});

    const state = reduce(submitted, setData({ users: [{}] }));

    expect(state.formHealth).toEqual({ status: 'ok' });
    // `firstName` was in the form before the submit attempt, so it is not a new input.
    expect(state.touchedControls).toEqual({ 'users.0.name': true });
    expect(state.validations).toEqual({
      firstName: ['required'],
      users: null,
      'users.0.name': ['required'],
    });
  });

  it.each([
    [false, 'an input outside a repeater', 'firstName'],
    [true, 'the input of a repeater row', 'users.0.name'],
  ])(
    'sets isFormValid to %s for an issue injected on %s before the first data',
    (isFormValid, _place, path) => {
      const state = drive([init(makeFormDef()), inject(path, ['taken'])]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.injectedValidations).toEqual({ [path]: ['taken'] });
      expect(state.isFormValid).toBe(isFormValid);
    },
  );

  describe('a prop override addressed by path', () => {
    it('stores the override under the uid of an input outside a repeater', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const state = drive([init(makeFormDef()), overrideByPath('firstName', 'Your name')]);

      expect(warn).not.toHaveBeenCalled();
      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetPropOverrides).toEqual({ firstNameInput: { placeholder: 'Your name' } });
    });

    it('warns and returns the same state for the path of a repeater row', () => {
      const initialized = drive([init(makeFormDef())]);
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const next = reduce(initialized, overrideByPath('users.0.name', 'Row name'));

      expect(next).toBe(initialized);
      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith('Input with path "users.0.name" not found');
    });
  });

  it.each([
    ['firstNameInput', false],
    ['bio', true],
  ])(
    'reports the widget %s with no computed widget and not hidden before the first data',
    (uid, hiddenAfterFirstData) => {
      const initialized = drive([init(makeFormDef())]);

      const before = widgetViewModel(initialized, uid);

      expect(initialized.formHealth).toEqual({ status: 'ok' });
      expect(before.widget).toBeUndefined();
      expect(before.hidden).toBe(false);

      // Control: the first data computes the widget, or hides it. An unknown uid gives neither.
      const afterFirstData = reduce(initialized, setData({}));
      const after = widgetViewModel(afterFirstData, uid);
      expect(afterFirstData.formHealth).toEqual({ status: 'ok' });
      expect(after.hidden).toBe(hiddenAfterFirstData);
      expect(after.widget === undefined).toBe(hiddenAfterFirstData);
    },
  );
});
