import { type StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { identityTranslator } from '../i18n';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * Which inputs a validation reads and writes, checked through the reducer: each test sends
 * `INITIALIZE`, `SET_DATA` and a validation action (`VALIDATE_ALL` or a blur), and reads
 * `validations` and `touchedControls` of the state that results.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.validated-inputs.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

/** Only `required` is supported. `message` replaces the message `required`. */
type TestValidator = { required?: boolean; message?: string };

/** An empty value fails a required validator, with the message of the validator object. */
const validators: ValidatorFn<TestValidator> = (validator): StandardSchemaV1 => {
  const message = validator?.message ?? 'required';
  return {
    '~standard': {
      version: 1,
      vendor: 'reducer-spec',
      validate: (value: unknown) => {
        const isEmpty = value === undefined || value === null || value === '';
        if (validator?.required && isEmpty) {
          return { issues: [{ message }] };
        }
        return { value };
      },
    },
  };
};

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

const setWidgetData = (path: string, data: unknown): Action => ({
  type: 'SET_WIDGET_DATA',
  payload: { path, data },
});

/** A blur on the input whose uid is its path. */
const blur = (path: string): Action => ({
  type: 'ATTEMPT_VALIDATION',
  payload: { reason: 'blur', path, uid: path },
});

const validateAllAction: Action = { type: 'VALIDATE_ALL' };

const inject = (path: string, issues: string[]): Action => ({
  type: 'INJECT_VALIDATION_ISSUES',
  payload: { path, issues },
});

/** A required input whose uid is its path. */
const requiredInput = (path: string) => ({
  uid: path,
  kind: 'input',
  type: 'textinput',
  path,
  validator: { required: true },
});

/** A checkbox, a required input that the checkbox shows, and an input without a validator. */
const makeNicknameFormDef = () => ({
  form: [
    { uid: 'hasNickname', kind: 'input', type: 'checkbox', path: 'hasNickname' },
    { ...requiredInput('nickname'), include: { when: '$form.hasNickname === true' } },
    { uid: 'email', kind: 'input', type: 'textinput', path: 'email' },
  ],
});

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('reducer: the inputs that a validation reads and writes', () => {
  describe('the validator of a state', () => {
    const makeStrictFormDef = () => ({
      states: { strict: '$form.strict === true' },
      form: [
        {
          uid: 'name',
          kind: 'input',
          type: 'textinput',
          path: 'name',
          validator: { required: true, message: 'Enter a name' },
          'validator.strict': { required: true, message: 'A strict form needs a name' },
        },
      ],
    });

    it.each([
      ['validator', 'is not active', false, [], 'Enter a name'],
      ['validator.strict', 'is active', true, ['strict'], 'A strict form needs a name'],
    ])(
      'validates with the %s value of the input when the state strict %s',
      (_key, _description, strict, currentStates, message) => {
        const state = drive([init(makeStrictFormDef()), setData({ strict }), validateAllAction]);

        expect(state.formHealth).toEqual({ status: 'ok' });
        expect(state.currentStates).toEqual(currentStates);
        expect(state.validations).toEqual({ name: [message] });
      },
    );
  });

  it('removes the result of a hidden input when a blur on another input validates the form', () => {
    const hidden = drive([
      init(makeNicknameFormDef()),
      setData({ hasNickname: true }),
      blur('nickname'),
      setWidgetData('hasNickname', false),
    ]);
    // A data write does not validate, so the error of the hidden input stays.
    expect(hidden.widgetFlags['nickname']).toEqual({ hidden: true });
    expect(hidden.validations).toEqual({
      hasNickname: null,
      nickname: ['required'],
      email: null,
    });

    const state = reduce(hidden, blur('email'));

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(state.validations).toEqual({ hasNickname: null, email: null });
    expect(state.validations).not.toHaveProperty('nickname');
  });

  it('does not touch a hidden input on a submit attempt, also when an injected issue touched it', () => {
    const injected = drive([
      init(makeNicknameFormDef()),
      setData({ hasNickname: false }),
      inject('nickname', ['taken']),
    ]);
    expect(injected.widgetFlags['nickname']).toEqual({ hidden: true });
    expect(injected.touchedControls).toEqual({ nickname: true });

    const state = reduce(injected, validateAllAction);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(state.touchedControls).toEqual({ hasNickname: true, email: true });
    expect(state.touchedControls).not.toHaveProperty('nickname');
  });
});
