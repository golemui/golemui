import { type StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { identityTranslator } from '../i18n';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * The default values of inputs, checked through the reducer: each test sends `INITIALIZE` and
 * `SET_DATA`, and reads the data and the records of the state that results.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.default-values.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

/** No test of this file needs a validation error, so the validator accepts every value. */
const validators: ValidatorFn<unknown> = (): StandardSchemaV1 => ({
  '~standard': {
    version: 1,
    vendor: 'reducer-spec',
    validate: (value: unknown) => ({ value }),
  },
});

const reduce = reducer({
  validators,
  validateOn: 'eager',
  localization: identityTranslator('en-US'),
  functions: {},
});

/** Dispatches the actions from a new initial state and returns the last state. */
const drive = (actions: Action[]): State => actions.reduce(reduce, createInitialState('en-US'));

const init = (...widgets: Record<string, unknown>[]): Action => ({
  type: 'INITIALIZE',
  payload: { formName: 'test-form', formDef: { form: widgets } },
});

const setData = (data: Record<string, any>): Action => ({
  type: 'SET_DATA',
  payload: { data },
});

const inputChild = (uid: string, path: string, extra: Record<string, unknown> = {}) => ({
  kind: 'input',
  uid,
  type: 'text',
  path,
  props: {},
  ...extra,
});

const displayChild = (uid: string) => ({
  kind: 'display',
  uid,
  type: 'markdownText',
  props: {},
});

const repeater = (
  uid: string,
  path: string,
  children: unknown[],
  extra: Record<string, unknown> = {},
) => ({
  kind: 'input',
  uid,
  type: 'repeater',
  path,
  props: {
    template: {
      kind: 'layout',
      uid: `${uid}-template`,
      type: 'flex',
      children,
    },
  },
  ...extra,
});

describe('reducer: default values', () => {
  it('writes the default value of an input that has no value yet', () => {
    // `SET_DATA` copies only the root object, so the state shares `address` with this object.
    const data = { address: {} };

    const state = drive([
      init(
        inputChild('firstName', 'user.firstName', { defaultValue: 'Ada' }),
        inputChild('city', 'address.city', { defaultValue: 'London' }),
      ),
      setData(data),
    ]);

    expect(state.data).toEqual({ user: { firstName: 'Ada' }, address: { city: 'London' } });
    expect(data).toEqual({ address: {} });
  });

  it('keeps a value that is already in the data, including a cleared one', () => {
    const afterSetData = drive([
      init(
        inputChild('firstName', 'firstName', { defaultValue: 'Ada' }),
        inputChild('lastName', 'lastName', { defaultValue: 'Lovelace' }),
        inputChild('age', 'age', { defaultValue: 42 }),
      ),
      setData({ firstName: '', lastName: null, age: undefined }),
    ]);

    expect(afterSetData.data).toEqual({ firstName: '', lastName: null, age: undefined });
    expect('age' in afterSetData.data).toBe(true);

    // A derive that writes no default keeps the data object.
    const afterSecondDerive = reduce(afterSetData, { type: 'SET_META', payload: { meta: {} } });

    expect(afterSecondDerive.formHealth).toEqual({ status: 'ok' });
    expect(afterSecondDerive.data).toBe(afterSetData.data);
  });

  it('writes undefined at the path of an input without a default, creating its parents', () => {
    const state = drive([init(inputChild('firstName', 'user.profile.firstName')), setData({})]);

    expect(state.data).toEqual({ user: { profile: { firstName: undefined } } });
    expect(state.data['user'].profile).toHaveProperty('firstName');
  });

  it('ignores widgets that are not inputs', () => {
    const afterSetData = drive([init(displayChild('note')), setData({})]);

    expect(afterSetData.data).toEqual({});
    expect(Object.keys(afterSetData.data)).toEqual([]);

    const afterSecondDerive = reduce(afterSetData, { type: 'SET_META', payload: { meta: {} } });

    expect(afterSecondDerive.formHealth).toEqual({ status: 'ok' });
    expect(afterSecondDerive.data).toBe(afterSetData.data);
  });

  it('creates the rows of a repeater default and then fills the inputs of those rows', () => {
    const state = drive([
      init(
        repeater(
          'users',
          'users',
          [inputChild('name', 'users.items.name', { defaultValue: 'anon' })],
          {
            defaultValue: [{}, {}],
          },
        ),
      ),
      setData({}),
    ]);

    expect(state.data).toEqual({ users: [{ name: 'anon' }, { name: 'anon' }] });
    expect(state.resolvedSources['name[0]']).toBeDefined();
    expect(state.resolvedSources['name[1]']).toBeDefined();
    expect(state.repeaterItemScopes['name[1]']).toEqual({ itemPath: 'users.1', index: 1 });
  });

  it('fills the inputs of rows that are already in the data', () => {
    const state = drive([
      init(
        repeater('users', 'users', [
          inputChild('name', 'users.items.name', { defaultValue: 'anon' }),
        ]),
      ),
      setData({ users: [{ name: 'Ada' }, {}] }),
    ]);

    expect(state.data).toEqual({ users: [{ name: 'Ada' }, { name: 'anon' }] });
  });

  it('resolves nested repeater defaults in one derive', () => {
    const devName = inputChild('devName', 'teams.items.devs.items.name', { defaultValue: 'dev' });
    const devs = repeater('devs', 'teams.items.devs', [devName], { defaultValue: [{}] });

    const state = drive([
      init(repeater('teams', 'teams', [devs], { defaultValue: [{}, {}] })),
      setData({}),
    ]);

    expect(state.data).toEqual({
      teams: [{ devs: [{ name: 'dev' }] }, { devs: [{ name: 'dev' }] }],
    });
    expect(state.resolvedSources['devName[1][0]']).toBeDefined();
    expect(state.repeaterItemScopes['devName[1][0]']).toEqual({
      itemPath: 'teams.1.devs.0',
      index: 0,
    });
  });

  it('clones the default value so the widget definition cannot be mutated through the data', () => {
    const defaultValue = { street: 'Main' };

    const state = drive([init(inputChild('address', 'address', { defaultValue })), setData({})]);

    expect(state.data['address']).toEqual({ street: 'Main' });
    expect(state.data['address']).not.toBe(defaultValue);
  });

  it('leaves the touched flags alone', () => {
    const touched = drive([
      init(inputChild('firstName', 'firstName', { defaultValue: 'Ada' })),
      setData({ firstName: 'Grace' }),
      {
        type: 'ATTEMPT_VALIDATION',
        payload: { reason: 'blur', path: 'firstName', uid: 'firstName' },
      },
    ]);
    expect(touched.touched).toBe(true);
    expect(touched.touchedControls).toEqual({ firstName: true });

    // The new data has no first name, so this derive writes its default.
    const defaulted = reduce(touched, setData({}));

    expect(defaulted.data['firstName']).toBe('Ada');
    expect(defaulted.touched).toBe(true);
    expect(defaulted.touchedControls).toBe(touched.touchedControls);
  });

  it('rebuilds resolvedSources and repeaterItemScopes for a form without repeaters', () => {
    const state = drive([init(inputChild('firstName', 'firstName')), setData({})]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    // `#0` is the root layout that holds the widgets of the form.
    expect(Object.keys(state.resolvedSources)).toEqual(['#0', 'firstName']);
    expect(state.resolvedSources['firstName']).toEqual(inputChild('firstName', 'firstName'));
    expect(state.repeaterItemScopes).toEqual({});
  });

  it('removes the widgets of the last row when the repeater has no row any more', () => {
    const state = drive([
      init(repeater('users', 'users', [inputChild('name', 'users.items.name')])),
      setData({ users: [{}] }),
      setData({ users: [] }),
    ]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(Object.keys(state.resolvedSources)).toEqual(['#0', 'users']);
    expect(state.repeaterItemScopes).toEqual({});
    expect(state.repeaterRows).toEqual({});
    expect(Object.keys(state.calculatedWidgets)).toEqual(['#0', 'users']);
  });
});
