import { describe, expect, it } from 'vitest';
import { type FormWidget } from '../../form-widget';
import { createInitialState, type State } from '../model';
import { moveRowState } from './move-row-state';
import { type RepeaterRowChange } from '../actions';

const rowInput = (uid: string, path: string) =>
  ({ kind: 'input', uid, type: 'text', path, props: {} }) as unknown as FormWidget<string>;

const stateWithRows = (): State => ({
  ...createInitialState('en-US'),
  touchedControls: { 'users.1.name': true, other: true },
  validations: { 'users.1.name': ['required'], other: null },
  injectedValidations: { 'users.1.name': ['taken'] },
  widgetPropOverrides: { 'name[1]': { placeholder: 'Second' }, other: { placeholder: 'Other' } },
  resolvedSources: {
    'name[0]': rowInput('name[0]', 'users.0.name'),
    'name[1]': rowInput('name[1]', 'users.1.name'),
  },
  repeaterRows: {
    'name[0]': [{ declaredItemPath: 'users.items', itemPath: 'users.0', index: 0 }],
    'name[1]': [{ declaredItemPath: 'users.items', itemPath: 'users.1', index: 1 }],
  },
});

const removed = (index: number): RepeaterRowChange => ({ type: 'removed', index });

describe('moveRowState', () => {
  it('renames the keys of the rows after a removed row', () => {
    const state = moveRowState(stateWithRows(), 'users', removed(0));

    expect(state.touchedControls).toEqual({ 'users.0.name': true, other: true });
    expect(state.validations).toEqual({ 'users.0.name': ['required'], other: null });
    expect(state.injectedValidations).toEqual({ 'users.0.name': ['taken'] });
    expect(state.widgetPropOverrides).toEqual({
      'name[0]': { placeholder: 'Second' },
      other: { placeholder: 'Other' },
    });
  });

  it('returns the same state when no key moves', () => {
    const before = stateWithRows();

    expect(moveRowState(before, 'users', removed(5))).toBe(before);
    expect(moveRowState(before, 'owners', removed(0))).toBe(before);
  });

  it('keeps the record of a map whose keys did not change', () => {
    const before = { ...stateWithRows(), injectedValidations: {} };

    const state = moveRowState(before, 'users', removed(0));

    expect(state).not.toBe(before);
    expect(state.injectedValidations).toBe(before.injectedValidations);
  });

  it.each([-1, 0.5, Number.NaN])('ignores the row position %s', (index) => {
    const before = stateWithRows();

    expect(moveRowState(before, 'users', removed(index))).toBe(before);
  });

  it('ignores a type it does not know', () => {
    const before = stateWithRows();
    const unknownChange = { type: 'moved', index: 0 } as unknown as RepeaterRowChange;

    expect(moveRowState(before, 'users', unknownChange)).toBe(before);
  });

  it('keeps a key named __proto__ as a key', () => {
    const before = {
      ...stateWithRows(),
      touchedControls: JSON.parse('{ "__proto__": true, "users.1.name": true }'),
    };

    const state = moveRowState(before, 'users', removed(0));

    expect(Object.keys(state.touchedControls).sort()).toEqual(['__proto__', 'users.0.name']);
    expect(Object.getPrototypeOf(state.touchedControls)).toBe(Object.prototype);
  });

  it('accepts an override on a widget whose uid is a name of Object.prototype', () => {
    const before: State = {
      ...stateWithRows(),
      widgetPropOverrides: {
        constructor: { placeholder: 'Static' },
      } as State['widgetPropOverrides'],
    };

    const state = moveRowState(before, 'users', removed(0));

    expect(state.widgetPropOverrides).toEqual({ constructor: { placeholder: 'Static' } });
  });

  it('keeps the brackets of a template uid', () => {
    const before: State = {
      ...stateWithRows(),
      widgetPropOverrides: { 'name[x][1]': { placeholder: 'Second' } },
      resolvedSources: { 'name[x][1]': rowInput('name[x][1]', 'users.1.name') },
      repeaterRows: {
        'name[x][1]': [{ declaredItemPath: 'users.items', itemPath: 'users.1', index: 1 }],
      },
    };

    const state = moveRowState(before, 'users', removed(0));

    expect(state.widgetPropOverrides).toEqual({ 'name[x][0]': { placeholder: 'Second' } });
  });
});
