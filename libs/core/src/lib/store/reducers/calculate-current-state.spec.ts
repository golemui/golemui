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
