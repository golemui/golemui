import { beforeEach, describe, expect, it } from 'vitest';
import { type ExpressionFunctions } from '../../shared';
import { createInitialState, type State } from '../model';
import { calculateCurrentState } from './calculate-current-state';

const runCurrentState = (state: State, functions: ExpressionFunctions = {}) =>
  calculateCurrentState(functions)(state);

describe('calculateCurrentState', () => {
  let state: State;

  beforeEach(() => {
    state = createInitialState('en-US');
  });

  it('activates a state from a $form expression', () => {
    state.formDef.states = { hasName: '$form.name !== undefined' };
    state.data = { name: 'Jane' };

    const next = runCurrentState(state);

    expect(next.currentStates).toEqual(['hasName']);
    expect(next.formHealth.status).toBe('ok');
  });

  describe('state hierarchy', () => {
    it('keeps a child state inactive while its parent state is false', () => {
      state.formDef.states = { register: 'false', 'register:adult': 'true' };

      const next = runCurrentState(state);

      expect(next.currentStates).toEqual([]);
    });

    it('activates a child state on its own when the same expression has no parent', () => {
      state.formDef.states = { 'register:adult': 'true' };

      const next = runCurrentState(state);

      expect(next.currentStates).toEqual(['register:adult']);
    });

    it('activates a parent and its child when both expressions are true', () => {
      state.formDef.states = { register: 'true', 'register:adult': 'true' };

      const next = runCurrentState(state);

      expect(next.currentStates).toEqual(['register', 'register:adult']);
    });

    it('requires every declared level of a three level state', () => {
      state.formDef.states = {
        register: 'true',
        'register:minor': '$form.age < 18',
        'register:minor:tall': '$form.height > 180',
      };

      state.data = { age: 15, height: 190 };
      expect(runCurrentState(state).currentStates).toEqual([
        'register',
        'register:minor',
        'register:minor:tall',
      ]);

      state.data = { age: 30, height: 190 };
      expect(runCurrentState(state).currentStates).toEqual(['register']);
    });

    it('skips an undeclared middle level and still requires the declared ones', () => {
      state.formDef.states = { a: 'true', 'a:b:c': 'true' };
      expect(runCurrentState(state).currentStates).toEqual(['a', 'a:b:c']);

      state.formDef.states = { a: 'false', 'a:b:c': 'true' };
      expect(runCurrentState(state).currentStates).toEqual([]);
    });

    it('lists the active states in declaration order', () => {
      state.formDef.states = { bb: 'true', aa: 'true', c: 'true', off: 'false' };

      const next = runCurrentState(state);

      expect(next.currentStates).toEqual(['bb', 'aa', 'c']);
    });
  });

  describe('results that are not the boolean true', () => {
    it('activates a state when its expression returns true', () => {
      state.formDef.states = { isTrue: 'true' };

      expect(runCurrentState(state).currentStates).toEqual(['isTrue']);
    });

    it.each([
      ["'yes'", 'a string'],
      ['1', 'a number'],
      ['({})', 'an object'],
      ['$form.missing', 'undefined'],
    ])('keeps a state inactive when its expression %s returns %s', (expression) => {
      state.formDef.states = { result: expression, always: 'true' };

      const next = runCurrentState(state);

      expect(next.currentStates).toEqual(['always']);
      expect(next.formHealth.status).toBe('ok');
    });

    it('treats an empty expression as an inactive state and keeps the form healthy', () => {
      state.formDef.states = { empty: '', always: 'true' };

      const next = runCurrentState(state);

      expect(next.currentStates).toEqual(['always']);
      expect(next.formHealth.status).toBe('ok');
    });

    it('treats an expression that reads a repeater row as an inactive state', () => {
      state.formDef.states = { inRow: '$item.x === 1', always: 'true' };
      state.data = { x: 1 };

      const next = runCurrentState(state);

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
      state.formDef.states = { registered: '$fn.isRegistered($form)' };
      state.data = { userId: 'u-1' };

      const next = runCurrentState(state, functions);

      expect(next.currentStates).toEqual(['registered']);
    });

    it('deactivates the state when the $fn expression is false', () => {
      state.formDef.states = { registered: '$fn.isRegistered($form)' };
      state.data = {};

      const next = runCurrentState(state, functions);

      expect(next.currentStates).toEqual([]);
    });

    it('treats a throwing $fn expression as false and keeps the form healthy', () => {
      state.formDef.states = { broken: '$fn.boom()' };

      const next = runCurrentState(state, functions);

      expect(next.currentStates).toEqual([]);
      expect(next.formHealth.status).toBe('ok');
    });

    it('treats a missing $fn function as false and keeps the form healthy', () => {
      state.formDef.states = { broken: '$fn.doesNotExist($form)' };

      const next = runCurrentState(state, functions);

      expect(next.currentStates).toEqual([]);
      expect(next.formHealth.status).toBe('ok');
    });
  });
});
