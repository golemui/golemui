import { describe, expect, it } from 'vitest';
import { type InputWidget, type LayoutWidget } from '../form-widget';
import { type State } from '../store/model';
import { calculateValidationVariables, flattenForm, pruneHiddenData } from './form';

describe('utils.form', () => {
  describe('flattenForm', () => {
    const textWidget = (uid: string) =>
      ({ uid, kind: 'input', type: 'textinput', path: uid }) satisfies InputWidget<unknown>;

    const layoutWidget = (uid: string, children: LayoutWidget['children']) =>
      ({ uid, kind: 'layout', type: 'flex', children }) satisfies LayoutWidget;

    it('returns an empty array for an empty form', () => {
      expect(flattenForm([])).toEqual([]);
    });

    it('returns the same widgets when there are no layout widgets', () => {
      const widgets = [textWidget('a'), textWidget('b')];
      expect(flattenForm(widgets)).toEqual(widgets);
    });

    it('includes the layout widget itself followed by its children', () => {
      const child1 = textWidget('street');
      const child2 = textWidget('city');
      const layout = layoutWidget('address', [child1, child2]);
      expect(flattenForm([layout])).toEqual([layout, child1, child2]);
    });

    it('flattens nested layout widgets recursively', () => {
      const leaf = textWidget('zip');
      const inner = layoutWidget('inner', [leaf]);
      const outer = layoutWidget('outer', [inner]);
      expect(flattenForm([outer])).toEqual([outer, inner, leaf]);
    });

    it('preserves order of top-level and nested widgets', () => {
      const first = textWidget('first');
      const child = textWidget('child');
      const last = textWidget('last');
      const layout = layoutWidget('layout', [child]);
      expect(flattenForm([first, layout, last])).toEqual([first, layout, child, last]);
    });
  });

  describe('calculateValidationVariables', () => {
    const makeState = (validations: State['validations']) =>
      ({ validations }) satisfies Pick<State, 'validations'> as unknown as State;

    it('returns $formIsInvalid: false and empty $errors when validations is empty', () => {
      const result = calculateValidationVariables(makeState({}));
      expect(result).toEqual({ $formIsInvalid: false, $errors: {} });
    });

    it('returns $formIsInvalid: false when all validations are null (valid)', () => {
      const result = calculateValidationVariables(makeState({ age: null, name: null }));
      expect(result).toEqual({ $formIsInvalid: false, $errors: {} });
    });

    it('sets $formIsInvalid: true when any field has errors', () => {
      const result = calculateValidationVariables(makeState({ age: ['Too young'] }));
      expect(result.$formIsInvalid).toBe(true);
    });

    it('populates $errors with the dot path of each invalid field', () => {
      const result = calculateValidationVariables(
        makeState({ age: ['Too young'], 'address.zip': ['Invalid zip'] }),
      );
      expect(result.$errors).toMatchObject({
        age: ['Too young'],
        address: { zip: ['Invalid zip'] },
      });
    });

    it('ignores null entries in $errors', () => {
      const result = calculateValidationVariables(makeState({ age: ['Too young'], name: null }));
      expect(result.$errors).not.toHaveProperty('name');
      expect(result.$errors).toMatchObject({ age: ['Too young'] });
    });
  });

  describe('pruneHiddenData', () => {
    const inputWidget = (path: string) =>
      ({ uid: '', kind: 'input', type: 'textinput', path }) satisfies InputWidget<unknown, string>;

    const layoutWidget = () =>
      ({ uid: '', kind: 'layout', type: 'flex', children: [] }) satisfies LayoutWidget<string>;

    const makeState = (
      data: State['data'],
      widgetFlags: State['widgetFlags'],
      resolvedSources: State['resolvedSources'],
    ) =>
      ({ data, widgetFlags, resolvedSources }) satisfies Pick<
        State,
        'data' | 'widgetFlags' | 'resolvedSources'
      > as unknown as State;

    it('returns data unchanged when no widgets are hidden', () => {
      const state = makeState(
        { name: 'Alice' },
        { nameField: {} },
        { nameField: inputWidget('name') },
      );
      expect(pruneHiddenData(state)).toEqual({ name: 'Alice' });
    });

    it('removes the path of a hidden input widget', () => {
      const state = makeState(
        { name: 'Alice', extra: 'hidden value' },
        { extraField: { hidden: true } },
        { extraField: inputWidget('extra') },
      );
      expect(pruneHiddenData(state)).toEqual({ name: 'Alice' });
    });

    it('does not mutate state.data', () => {
      const data = { name: 'Alice', extra: 'hidden value' };
      const state = makeState(
        data,
        { extraField: { hidden: true } },
        { extraField: inputWidget('extra') },
      );
      pruneHiddenData(state);
      expect(data).toEqual({ name: 'Alice', extra: 'hidden value' });
    });

    it('removes a nested dot-path for a hidden widget', () => {
      const state = makeState(
        { user: { name: 'Alice', age: 30 } },
        { ageField: { hidden: true } },
        { ageField: inputWidget('user.age') },
      );
      expect(pruneHiddenData(state)).toEqual({ user: { name: 'Alice' } });
    });

    it('prunes empty ancestor objects after removing the only nested value', () => {
      const state = makeState(
        { user: { age: 30 } },
        { ageField: { hidden: true } },
        { ageField: inputWidget('user.age') },
      );
      expect(pruneHiddenData(state)).toEqual({});
    });

    it('removes paths for all hidden widgets', () => {
      const state = makeState(
        { name: 'Alice', city: 'BCN', country: 'ES' },
        { cityField: { hidden: true }, countryField: { hidden: true } },
        { cityField: inputWidget('city'), countryField: inputWidget('country') },
      );
      expect(pruneHiddenData(state)).toEqual({ name: 'Alice' });
    });

    it('skips entries with hidden not strictly true', () => {
      const state = makeState(
        { name: 'Alice' },
        { nameField: { hidden: undefined } },
        { nameField: inputWidget('name') },
      );
      expect(pruneHiddenData(state)).toEqual({ name: 'Alice' });
    });

    it('skips hidden layout widgets (no path to prune)', () => {
      const state = makeState(
        { name: 'Alice' },
        { section: { hidden: true } },
        { section: layoutWidget() },
      );
      expect(pruneHiddenData(state)).toEqual({ name: 'Alice' });
    });

    it('skips uid entries absent from resolvedSources', () => {
      const state = makeState(
        { items: [{ name: 'Alice' }] },
        { 'itemName[0]': { hidden: true } },
        {},
      );
      expect(pruneHiddenData(state)).toEqual({ items: [{ name: 'Alice' }] });
    });

    it('removes the path of a hidden repeater row input', () => {
      const state = makeState(
        { users: [{ name: 'Alice' }, { name: 'Bob' }] },
        { 'name[1]': { hidden: true } },
        { 'name[0]': inputWidget('users.0.name'), 'name[1]': inputWidget('users.1.name') },
      );
      expect(pruneHiddenData(state)).toEqual({ users: [{ name: 'Alice' }, {}] });
    });
  });
});
