import { type StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { identityTranslator } from '../i18n';
import { EXPRESSION_LIMITS, type ExpressionPolicy } from '../utils/check-expression';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * The active states of a form, checked through the reducer: each test sends `INITIALIZE` and
 * `SET_DATA`, sometimes a second `SET_DATA`, and reads `currentStates` and the form health of the
 * state that results.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.active-states.spec.ts
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

const makeReducer = (expressionPolicy: ExpressionPolicy = 'warn') =>
  reducer({
    validators,
    validateOn: 'eager',
    localization: identityTranslator('en-US'),
    functions: {},
    expressionPolicy,
  });

const setData = (data: Record<string, any>): Action => ({
  type: 'SET_DATA',
  payload: { data },
});

/** Sends `INITIALIZE` and `SET_DATA` to a new reducer and returns the state after the derive. */
const run = (
  formDef: Record<string, unknown>,
  data: Record<string, any> = {},
  expressionPolicy: ExpressionPolicy = 'warn',
): State => {
  const actions: Action[] = [
    { type: 'INITIALIZE', payload: { formName: 'test-form', formDef } },
    setData(data),
  ];
  return actions.reduce(makeReducer(expressionPolicy), createInitialState('en-US'));
};

/** Runs a form that has only the given states and no widgets. */
const runStates = (
  states: Record<string, string>,
  data: Record<string, any> = {},
  expressionPolicy: ExpressionPolicy = 'warn',
): State => run({ states, form: [] }, data, expressionPolicy);

/** The message that follows the quoted text when an expression calls `pop`. */
const popRejection =
  '[EXPRESSION_REJECTED] The method "pop" changes the array in place, so it writes into the data. Expressions can only read.';

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('reducer: active states', () => {
  describe('a form without states', () => {
    it.each([
      ['without a states key', { form: [] }],
      ['with an empty states object', { states: {}, form: [] }],
    ])('keeps the same currentStates array over two derives for a form %s', (_name, formDef) => {
      const reduce = makeReducer();
      const actions: Action[] = [
        { type: 'INITIALIZE', payload: { formName: 'test-form', formDef } },
        setData({ a: 1 }),
      ];
      const first = actions.reduce(reduce, createInitialState('en-US'));

      const second = reduce(first, setData({ a: 2 }));

      expect(second.formHealth).toEqual({ status: 'ok' });
      expect(second.currentStates).toEqual([]);
      expect(second.currentStates).toBe(first.currentStates);
    });
  });

  describe('state names with parents', () => {
    it('activates a child state whose parent has an empty text', () => {
      const state = runStates({ e: '', 'e:c': 'true' });

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.currentStates).toEqual(['e:c']);
    });

    it('gives a child state with an empty text only the conditions of its parent', () => {
      const parentTrue = runStates({ t: 'true', 't:empty': '' });
      const parentFalse = runStates({ t: 'false', 't:empty': '' });

      expect(parentTrue.formHealth).toEqual({ status: 'ok' });
      expect(parentTrue.currentStates).toEqual(['t', 't:empty']);
      expect(parentFalse.formHealth).toEqual({ status: 'ok' });
      expect(parentFalse.currentStates).toEqual([]);
    });
  });

  describe('states that fail', () => {
    it('reports code 50 for a rejected state, also when a condition of a widget would throw', () => {
      // Without the state, `$form.x.y` throws and the form gets code 11.
      const formDef = {
        states: { bad: '$form.t.pop() === 1' },
        form: [{ uid: 'title', kind: 'display', type: 'heading', include: { when: '$form.x.y' } }],
      };

      const state = run(formDef, { t: [1] });

      expect(state.formHealth).toEqual({
        status: 'errored',
        code: 50,
        message: `[50] Rejected expression "($form.t.pop() === 1)": ${popRejection}`,
      });
      expect(state.data).toEqual({ t: [1] });
    });

    it.each([
      ['a state without a parent', { bad: '$form.tags.pop()' }, '($form.tags.pop())'],
      [
        'a state with a parent',
        { a: '$form.a === 1', 'a:b': '$form.tags.pop()' },
        '($form.a === 1) && ($form.tags.pop())',
      ],
    ])(
      'quotes each state text in parentheses in the message of %s that is rejected',
      (_name, states, quotedText) => {
        const state = runStates(states, { a: 1, tags: ['x'] });

        expect(state.formHealth).toEqual({
          status: 'errored',
          code: 50,
          message: `[50] Rejected expression "${quotedText}": ${popRejection}`,
        });
      },
    );

    it('measures the length of a state text together with the conditions of its parents', () => {
      // Each text alone is under the limit. The two texts with their parentheses are over it.
      const longComparison = (name: string) => `$form.${name} ===${' '.repeat(200)}1`;
      const parentText = longComparison('a');
      const childText = longComparison('b');
      const quotedText = `(${parentText}) && (${childText})`;
      expect(parentText.length).toBeLessThan(EXPRESSION_LIMITS.maxLength);
      expect(quotedText.length).toBeGreaterThan(EXPRESSION_LIMITS.maxLength);

      const parentOnly = runStates({ a: parentText }, { a: 1, b: 1 }, 'strict');
      const withChild = runStates({ a: parentText, 'a:b': childText }, { a: 1, b: 1 }, 'strict');

      expect(parentOnly.formHealth).toEqual({ status: 'ok' });
      expect(parentOnly.currentStates).toEqual(['a']);
      expect(withChild.formHealth).toEqual({
        status: 'errored',
        code: 50,
        message: `[50] Rejected expression "${quotedText}": [EXPRESSION_TOO_LARGE] The expression has ${quotedText.length} characters. The limit is ${EXPRESSION_LIMITS.maxLength}.`,
      });
    });

    it.each([
      ['does not parse', '$form..x'],
      ['does not compile', '$form[]'],
    ])('treats a state whose text %s as inactive and keeps the form healthy', (_name, text) => {
      const state = runStates({ broken: text, always: 'true' });

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.currentStates).toEqual(['always']);
    });
  });
});
