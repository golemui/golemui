import { beforeEach, describe, expect, it } from 'vitest';
import { type FormWidget } from '../../form-widget';
import { createInitialState, type State } from '../model';
import { applyDefaultValues } from './apply-default-values';

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

const inputChild = (uid: string, path: string, extra: Record<string, unknown> = {}) =>
  ({
    kind: 'input',
    uid,
    type: 'text',
    path,
    props: {},
    ...extra,
  }) as unknown as FormWidget<string>;

const displayChild = (uid: string) =>
  ({
    kind: 'display',
    uid,
    type: 'markdownText',
    props: {},
  }) as unknown as FormWidget<string>;

const repeater = (
  uid: string,
  path: string,
  children: unknown[],
  extra: Record<string, unknown> = {},
) =>
  ({
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
  }) as unknown as FormWidget<string>;

const flatFormOf = (...widgets: FormWidget<string>[]): State['flatForm'] =>
  Object.fromEntries(widgets.map((widget) => [widget.uid as string, widget]));

describe('applyDefaultValues', () => {
  let state: State;

  beforeEach(() => {
    state = createInitialState('en-US');
  });

  it('writes the default value of an input that has no value yet', () => {
    state.flatForm = flatFormOf(inputChild('firstName', 'user.firstName', { defaultValue: 'Ada' }));

    const result = applyDefaultValues(state);

    expect(result.data).toEqual({ user: { firstName: 'Ada' } });
    expect(state.data).toEqual({});
  });

  it('keeps a value that is already in the data, including a cleared one', () => {
    state.flatForm = flatFormOf(
      inputChild('firstName', 'firstName', { defaultValue: 'Ada' }),
      inputChild('lastName', 'lastName', { defaultValue: 'Lovelace' }),
      inputChild('age', 'age', { defaultValue: 42 }),
    );
    state.data = { firstName: '', lastName: null, age: undefined };

    const result = applyDefaultValues(state);

    expect(result.data).toEqual({ firstName: '', lastName: null, age: undefined });
    expect(result.data).toBe(state.data);
  });

  it('writes undefined at the path of an input without a default, creating its parents', () => {
    state.flatForm = flatFormOf(inputChild('firstName', 'user.profile.firstName'));

    const result = applyDefaultValues(state);

    expect(result.data).toEqual({ user: { profile: { firstName: undefined } } });
    expect(result.data['user'].profile).toHaveProperty('firstName');
  });

  it('ignores widgets that are not inputs', () => {
    state.flatForm = flatFormOf(displayChild('note'));

    const result = applyDefaultValues(state);

    expect(result.data).toEqual({});
    expect(result.data).toBe(state.data);
  });

  it('creates the rows of a repeater default and then fills the inputs of those rows', () => {
    state.flatForm = flatFormOf(
      repeater(
        'users',
        'users',
        [inputChild('name', 'users.items.name', { defaultValue: 'anon' })],
        {
          defaultValue: [{}, {}],
        },
      ),
    );

    const result = applyDefaultValues(state);

    expect(result.data).toEqual({ users: [{ name: 'anon' }, { name: 'anon' }] });
    expect(result.resolvedSources['name[0]']).toBeDefined();
    expect(result.resolvedSources['name[1]']).toBeDefined();
    expect(result.repeaterItemScopes['name[1]']).toEqual({ itemPath: 'users.1', index: 1 });
  });

  it('fills the inputs of rows that are already in the data', () => {
    state.flatForm = flatFormOf(
      repeater('users', 'users', [
        inputChild('name', 'users.items.name', { defaultValue: 'anon' }),
      ]),
    );
    state.data = { users: [{ name: 'Ada' }, {}] };

    const result = applyDefaultValues(state);

    expect(result.data).toEqual({ users: [{ name: 'Ada' }, { name: 'anon' }] });
  });

  it('resolves nested repeater defaults in the same call', () => {
    const devName = inputChild('devName', 'teams.items.devs.items.name', { defaultValue: 'dev' });
    const devs = repeater('devs', 'teams.items.devs', [devName], { defaultValue: [{}] });
    state.flatForm = flatFormOf(repeater('teams', 'teams', [devs], { defaultValue: [{}, {}] }));

    const result = applyDefaultValues(state);

    expect(result.data).toEqual({
      teams: [{ devs: [{ name: 'dev' }] }, { devs: [{ name: 'dev' }] }],
    });
    expect(result.resolvedSources['devName[1][0]']).toBeDefined();
    expect(result.repeaterItemScopes['devName[1][0]']).toEqual({
      itemPath: 'teams.1.devs.0',
      index: 0,
    });
  });

  it('clones the default value so the widget definition cannot be mutated through the data', () => {
    const defaultValue = { street: 'Main' };
    state.flatForm = flatFormOf(inputChild('address', 'address', { defaultValue }));

    const result = applyDefaultValues(state);

    expect(result.data['address']).toEqual({ street: 'Main' });
    expect(result.data['address']).not.toBe(defaultValue);
  });

  it('leaves the touched flags alone', () => {
    state.flatForm = flatFormOf(inputChild('firstName', 'firstName', { defaultValue: 'Ada' }));
    state.touchedControls = { firstName: true };

    const result = applyDefaultValues(state);

    expect(result.touched).toBe(false);
    expect(result.touchedControls).toBe(state.touchedControls);
  });

  it('rebuilds resolvedSources and repeaterItemScopes for a form without repeaters', () => {
    const firstName = inputChild('firstName', 'firstName');
    state.flatForm = flatFormOf(firstName);

    const result = applyDefaultValues(state);

    expect(result.resolvedSources).toEqual({ firstName });
    expect(result.repeaterItemScopes).toEqual({});
  });
});
