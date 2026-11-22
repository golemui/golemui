import { type StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { identityTranslator } from '../i18n';
import { type ExpressionFunctions } from '../shared';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * The active states of a form, checked through the reducer: each test sends `INITIALIZE` and
 * `SET_DATA`, and reads `currentStates` and the form health of the state that results.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.states.spec.ts
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

/**
 * Initializes a form that has only the given states, sets the data, and returns the state that
 * results.
 */
const runCurrentState = (
  states: Record<string, string>,
  data: Record<string, any> = {},
  functions: ExpressionFunctions = {},
): State => {
  const reduce = reducer({
    validators,
    validateOn: 'eager',
    localization: identityTranslator('en-US'),
    functions,
  });
  const actions: Action[] = [
    { type: 'INITIALIZE', payload: { formName: 'test-form', formDef: { states, form: [] } } },
    { type: 'SET_DATA', payload: { data } },
  ];
  return actions.reduce(reduce, createInitialState('en-US'));
};

describe('reducer: current states', () => {
  it('activates a state from a $form expression', () => {
    const next = runCurrentState({ hasName: '$form.name !== undefined' }, { name: 'Jane' });

    expect(next.currentStates).toEqual(['hasName']);
    expect(next.formHealth.status).toBe('ok');
  });

  describe('state hierarchy', () => {
    it('keeps a child state inactive while its parent state is false', () => {
      const next = runCurrentState({ register: 'false', 'register:adult': 'true' });

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(next.currentStates).toEqual([]);
    });

    it('activates a child state on its own when the same expression has no parent', () => {
      const next = runCurrentState({ 'register:adult': 'true' });

      expect(next.currentStates).toEqual(['register:adult']);
    });

    it('activates a parent and its child when both expressions are true', () => {
      const next = runCurrentState({ register: 'true', 'register:adult': 'true' });

      expect(next.currentStates).toEqual(['register', 'register:adult']);
    });

    it('requires every declared level of a three level state', () => {
      const states = {
        register: 'true',
        'register:minor': '$form.age < 18',
        'register:minor:tall': '$form.height > 180',
      };

      expect(runCurrentState(states, { age: 15, height: 190 }).currentStates).toEqual([
        'register',
        'register:minor',
        'register:minor:tall',
      ]);

      expect(runCurrentState(states, { age: 30, height: 190 }).currentStates).toEqual(['register']);
    });

    it('skips an undeclared middle level and still requires the declared ones', () => {
      expect(runCurrentState({ a: 'true', 'a:b:c': 'true' }).currentStates).toEqual(['a', 'a:b:c']);

      const next = runCurrentState({ a: 'false', 'a:b:c': 'true' });
      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(next.currentStates).toEqual([]);
    });

    it('lists the active states in declaration order', () => {
      const next = runCurrentState({ bb: 'true', aa: 'true', c: 'true', off: 'false' });

      expect(next.currentStates).toEqual(['bb', 'aa', 'c']);
    });
  });

  describe('results that are not the boolean true', () => {
    it('activates a state when its expression returns true', () => {
      expect(runCurrentState({ isTrue: 'true' }).currentStates).toEqual(['isTrue']);
    });

    it.each([
      ["'yes'", 'a string'],
      ['1', 'a number'],
      ['({})', 'an object'],
      ['$form.missing', 'undefined'],
    ])('keeps a state inactive when its expression %s returns %s', (expression) => {
      const next = runCurrentState({ result: expression, always: 'true' });

      expect(next.currentStates).toEqual(['always']);
      expect(next.formHealth.status).toBe('ok');
    });

    it('treats an empty expression as an inactive state and keeps the form healthy', () => {
      const next = runCurrentState({ empty: '', always: 'true' });

      expect(next.currentStates).toEqual(['always']);
      expect(next.formHealth.status).toBe('ok');
    });

    it('treats an expression that reads a repeater row as an inactive state', () => {
      const next = runCurrentState({ inRow: '$item.x === 1', always: 'true' }, { x: 1 });

      expect(next.currentStates).toEqual(['always']);
      expect(next.formHealth.status).toBe('ok');
    });
  });

  describe('$fn host functions', () => {
    const functions: ExpressionFunctions = {
      isRegistered: (form: { userId?: string }) => form.userId !== undefined,
      boom: () => {
        throw new Error('host function failure');
      },
    };

    it('activates a state from a $fn expression', () => {
      const next = runCurrentState(
        { registered: '$fn.isRegistered($form)' },
        { userId: 'u-1' },
        functions,
      );

      expect(next.currentStates).toEqual(['registered']);
    });

    it('deactivates the state when the $fn expression is false', () => {
      const next = runCurrentState({ registered: '$fn.isRegistered($form)' }, {}, functions);

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(next.currentStates).toEqual([]);
    });

    it('treats a throwing $fn expression as false and keeps the form healthy', () => {
      const next = runCurrentState({ broken: '$fn.boom()' }, {}, functions);

      expect(next.currentStates).toEqual([]);
      expect(next.formHealth.status).toBe('ok');
    });

    it('treats a missing $fn function as false and keeps the form healthy', () => {
      const next = runCurrentState({ broken: '$fn.doesNotExist($form)' }, {}, functions);

      expect(next.currentStates).toEqual([]);
      expect(next.formHealth.status).toBe('ok');
    });
  });
});
