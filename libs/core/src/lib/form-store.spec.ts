import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from './form-validator';
import { createFormStore } from './form-store';
import { identityTranslator } from './i18n';
import { type Action } from './store/actions';
import { type Middleware, type State } from './store/model';

/**
 * Runs the store without a framework.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/form-store.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

const requiredValidators: ValidatorFn<{ required?: boolean }> = (validator) => ({
  '~standard': {
    version: 1,
    vendor: 'test',
    validate: (value) => {
      const isEmpty = value === undefined || value === null || value === '';
      return validator?.required && isEmpty ? { issues: [{ message: 'required' }] } : { value };
    },
  },
});

const makeFormDef = () => ({
  states: { adult: '$form.age >= 18' },
  form: [
    {
      uid: 'name',
      kind: 'input',
      type: 'textinput',
      path: 'name',
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
          uid: 'userRow',
          kind: 'layout',
          type: 'flex',
          children: [
            { uid: 'userName', kind: 'input', type: 'textinput', path: 'users.items.name' },
          ],
        },
      },
    },
  ],
});

const makeStore = (
  middlewares: Middleware<State, Action>[] = [],
  validateOn: Parameters<typeof createFormStore>[2] = 'eager',
  lang = 'en-US',
) => createFormStore(middlewares, requiredValidators, validateOn, identityTranslator(lang));

/** A store with a form, data and a full validation pass, so no record is empty. */
const makeReadyStore = (middlewares: Middleware<State, Action>[] = []) => {
  const store = makeStore(middlewares);
  store.dispatch({ type: 'INITIALIZE', payload: { formName: 'test', formDef: makeFormDef() } });
  store.dispatch({
    type: 'SET_DATA',
    payload: { data: { name: 'Ada', age: 20, users: [{ name: 'Linus' }] } },
  });
  store.dispatch({ type: 'VALIDATE_ALL' });
  return store;
};

// -----------------------------------------------------------------------------
// Specs
// -----------------------------------------------------------------------------

describe('createFormStore', () => {
  it('starts with the language of the translator', () => {
    expect(makeStore([], 'eager', 'fr-FR').getState().lang).toBe('fr-FR');
  });

  describe('middlewares', () => {
    it('runs the first middleware outermost: a before, b before, b after, a after', () => {
      const calls: string[] = [];
      const named =
        (name: string): Middleware<State, Action> =>
        () =>
        (next) =>
        (action) => {
          calls.push(`${name}:before:${action.type}`);
          next(action);
          calls.push(`${name}:after:${action.type}`);
        };
      const store = makeStore([named('a'), named('b')]);

      store.dispatch({ type: 'SET_META', payload: { meta: {} } });

      expect(calls).toEqual([
        'a:before:SET_META',
        'b:before:SET_META',
        'b:after:SET_META',
        'a:after:SET_META',
      ]);
    });

    it('returns the reduced state from getState after next, and the old state before next', () => {
      const seen: { before?: unknown; after?: unknown } = {};
      const reader: Middleware<State, Action> = (api) => (next) => (action) => {
        seen.before = api.getState().meta;
        next(action);
        seen.after = api.getState().meta;
      };
      const store = makeStore([reader]);

      store.dispatch({ type: 'SET_META', payload: { meta: { mode: 'dev' } } });

      expect(seen.before).toEqual({});
      expect(seen.after).toEqual({ mode: 'dev' });
    });

    it('sends an action dispatched by a middleware through the whole chain', () => {
      const seenByFirst: string[] = [];
      const first: Middleware<State, Action> = () => (next) => (action) => {
        seenByFirst.push(action.type);
        next(action);
      };
      const second: Middleware<State, Action> = (api) => (next) => (action) => {
        next(action);
        if (action.type === 'SET_META') {
          api.dispatch({ type: 'SET_LANGUAGE', payload: { lang: 'fr-FR' } });
        }
      };
      const store = makeStore([first, second]);

      store.dispatch({ type: 'SET_META', payload: { meta: {} } });

      expect(seenByFirst).toEqual(['SET_META', 'SET_LANGUAGE']);
      expect(store.getState().lang).toBe('fr-FR');
    });
  });

  describe('state$', () => {
    it('emits the current state to a new subscriber, and one state per changing action', () => {
      const store = makeStore();
      const states: State[] = [];
      store.state$.subscribe((state) => states.push(state));
      expect(states).toHaveLength(1);

      store.dispatch({ type: 'SET_META', payload: { meta: { a: 1 } } });

      expect(states).toHaveLength(2);
      expect(states[1]).toBe(store.getState());
    });

    it('does not emit when the reducer returns the same state', () => {
      const store = makeStore([], 'blur');
      const states: State[] = [];
      store.state$.subscribe((state) => states.push(state));
      const before = store.getState();

      // The form validates on blur only, so a change is ignored.
      store.dispatch({
        type: 'ATTEMPT_VALIDATION',
        payload: { reason: 'change', path: 'name', uid: 'name' },
      });

      expect(store.getState()).toBe(before);
      expect(states).toHaveLength(1);

      store.dispatch({
        type: 'ATTEMPT_VALIDATION',
        payload: { reason: 'blur', path: 'name', uid: 'name' },
      });

      expect(states).toHaveLength(2);
    });
  });

  describe('which records an action replaces', () => {
    type Records =
      | 'data'
      | 'flatForm'
      | 'resolvedSources'
      | 'calculatedWidgets'
      | 'widgetFlags'
      | 'repeaterItemScopes'
      | 'repeaterRows'
      | 'validations'
      | 'touchedControls';

    const allRecords: Records[] = [
      'data',
      'flatForm',
      'resolvedSources',
      'calculatedWidgets',
      'widgetFlags',
      'repeaterItemScopes',
      'repeaterRows',
      'validations',
      'touchedControls',
    ];

    // `kept` records are the same object after the action. `replaced` records are a new object.
    // A record in neither list is not checked, because a new object there is not required.
    const rows: { name: string; action: Action; kept: Records[]; replaced: Records[] }[] = [
      {
        name: 'SET_DATA',
        action: {
          type: 'SET_DATA',
          payload: { data: { name: 'Grace', age: 20, users: [{ name: 'Linus' }] } },
        },
        kept: ['flatForm', 'validations', 'touchedControls'],
        replaced: ['data', 'calculatedWidgets'],
      },
      {
        name: 'SET_WIDGET_DATA',
        action: { type: 'SET_WIDGET_DATA', payload: { path: 'name', data: 'Grace' } },
        kept: ['flatForm', 'validations', 'touchedControls'],
        replaced: ['data', 'calculatedWidgets'],
      },
      {
        name: 'SET_META',
        action: { type: 'SET_META', payload: { meta: { mode: 'dev' } } },
        kept: ['data', 'flatForm', 'validations', 'touchedControls'],
        replaced: ['calculatedWidgets'],
      },
      {
        name: 'SET_LANGUAGE',
        action: { type: 'SET_LANGUAGE', payload: { lang: 'fr-FR' } },
        kept: allRecords.filter((record) => record !== 'calculatedWidgets'),
        replaced: ['calculatedWidgets'],
      },
      {
        name: 'OVERRIDE_WIDGET_PROP',
        action: {
          type: 'OVERRIDE_WIDGET_PROP',
          payload: { uid: 'name', prop: 'placeholder', value: 'Your name' },
        },
        kept: ['data', 'flatForm', 'touchedControls'],
        replaced: ['calculatedWidgets'],
      },
      {
        name: 'INJECT_VALIDATION_ISSUES',
        action: { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'name', issues: ['taken'] } },
        kept: allRecords.filter((record) => record !== 'touchedControls'),
        replaced: ['touchedControls'],
      },
      {
        name: 'ATTEMPT_VALIDATION',
        action: {
          type: 'ATTEMPT_VALIDATION',
          payload: { reason: 'blur', path: 'name', uid: 'name' },
        },
        kept: ['data', 'flatForm'],
        replaced: ['validations', 'touchedControls'],
      },
      {
        name: 'VALIDATE_ALL',
        action: { type: 'VALIDATE_ALL' },
        kept: ['data', 'flatForm'],
        replaced: ['validations', 'touchedControls'],
      },
      {
        name: 'SET_FORM_HEALTH',
        action: { type: 'SET_FORM_HEALTH', payload: { formHealth: { status: 'ok' } } },
        kept: allRecords,
        replaced: [],
      },
      {
        name: 'INITIALIZE',
        action: { type: 'INITIALIZE', payload: { formName: 'test', formDef: makeFormDef() } },
        kept: [],
        replaced: allRecords,
      },
    ];

    it.each(rows)('$name', ({ action, kept, replaced }) => {
      let before: State | undefined;
      let after: State | undefined;
      const recorder: Middleware<State, Action> = (api) => (next) => (nextAction) => {
        if (nextAction === action) {
          before = api.getState();
        }
        next(nextAction);
        if (nextAction === action) {
          after = api.getState();
        }
      };
      const store = makeReadyStore([recorder]);

      store.dispatch(action);

      expect(before).toBeDefined();
      expect(after).toBeDefined();
      for (const record of kept) {
        expect(after?.[record], `${record} is kept`).toBe(before?.[record]);
      }
      for (const record of replaced) {
        expect(after?.[record], `${record} is replaced`).not.toBe(before?.[record]);
      }
    });
  });
});
