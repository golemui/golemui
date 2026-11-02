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
    const makeState = (
      validations: State['validations'],
      resolvedSources: State['resolvedSources'] = Object.fromEntries(
        Object.keys(validations).map((path) => [path, inputWidget(path)]),
      ),
      widgetFlags: State['widgetFlags'] = {},
    ) =>
      ({ validations, resolvedSources, widgetFlags }) satisfies Pick<
        State,
        'validations' | 'resolvedSources' | 'widgetFlags'
      > as unknown as State;

    const inputWidget = (path: string) =>
      ({ uid: path, kind: 'input', type: 'textinput', path }) satisfies InputWidget<
        unknown,
        string
      >;

    it('skips the error of a hidden input', () => {
      const result = calculateValidationVariables(
        makeState({ vat: ['required'] }, { vat: inputWidget('vat') }, { vat: { hidden: true } }),
      );
      expect(result).toEqual({ $formIsInvalid: false, $errors: {} });
    });

    it('skips an error on a path that no input owns', () => {
      const result = calculateValidationVariables(makeState({ ghost: ['required'] }, {}));
      expect(result).toEqual({ $formIsInvalid: false, $errors: {} });
    });

    it('keeps the error when a visible input has the same path as a hidden input', () => {
      const result = calculateValidationVariables(
        makeState(
          { vat: ['required'] },
          { companyVat: inputWidget('vat'), personVat: inputWidget('vat') },
          { companyVat: { hidden: true } },
        ),
      );
      expect(result).toEqual({ $formIsInvalid: true, $errors: { vat: ['required'] } });
    });

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

    it('replaces the message of a container with the errors of row 0 when that row has an error', () => {
      const result = calculateValidationVariables(
        makeState({
          users: ['min 2'],
          'users.0.name': ['required'],
          'users.1.name': ['too short'],
        }),
      );
      expect(result).toEqual({
        $formIsInvalid: true,
        $errors: { users: [{ name: ['required'] }, { name: ['too short'] }] },
      });
    });

    it('keeps the message of a container at index 0 when only row 1 has an error', () => {
      const result = calculateValidationVariables(
        makeState({ users: ['min 2'], 'users.0.name': null, 'users.1.name': ['required'] }),
      );
      expect(result.$errors).toEqual({ users: ['min 2', { name: ['required'] }] });
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
      repeaterItemScopes: State['repeaterItemScopes'] = {},
    ) =>
      ({ data, widgetFlags, resolvedSources, repeaterItemScopes }) satisfies Pick<
        State,
        'data' | 'widgetFlags' | 'resolvedSources' | 'repeaterItemScopes'
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

    it('keeps the value of a hidden input when a visible input has the same path', () => {
      const state = makeState(
        { region: 'us', country: 'Canada' },
        { euCountry: { hidden: true }, otherCountry: {} },
        { euCountry: inputWidget('country'), otherCountry: inputWidget('country') },
      );
      expect(pruneHiddenData(state)).toEqual({ region: 'us', country: 'Canada' });
    });

    it('keeps the value of a hidden input when a visible input has a path below it', () => {
      const state = makeState(
        { address: { street: 'Main St', city: 'Oslo' } },
        { search: { hidden: true }, street: {}, city: {} },
        {
          search: inputWidget('address'),
          street: inputWidget('address.street'),
          city: inputWidget('address.city'),
        },
      );
      expect(pruneHiddenData(state)).toEqual({ address: { street: 'Main St', city: 'Oslo' } });
    });

    it('keeps the value of a hidden input when a visible input has a path above it', () => {
      const state = makeState(
        { address: { street: 'Main St', city: 'Oslo' } },
        { search: {}, city: { hidden: true } },
        { search: inputWidget('address'), city: inputWidget('address.city') },
      );
      expect(pruneHiddenData(state)).toEqual({ address: { street: 'Main St', city: 'Oslo' } });
    });

    it('removes a hidden row input of a visible repeater', () => {
      const state = makeState(
        { users: [{ name: 'Alice' }, { name: 'Bob' }] },
        { users: {}, 'name[1]': { hidden: true } },
        {
          users: inputWidget('users'),
          'name[0]': inputWidget('users.0.name'),
          'name[1]': inputWidget('users.1.name'),
        },
        {
          'name[0]': { itemPath: 'users.0', index: 0 },
          'name[1]': { itemPath: 'users.1', index: 1 },
        },
      );
      expect(pruneHiddenData(state)).toEqual({ users: [{ name: 'Alice' }, {}] });
    });

    it('does not change an object that is not a plain object to remove a hidden value', () => {
      class Profile {
        constructor(
          public name: string,
          public nickname?: string,
        ) {}
      }
      const profile = new Profile('Ann', 'Annie');
      const state = makeState(
        { profile },
        { nickname: { hidden: true } },
        { nickname: inputWidget('profile.nickname') },
      );
      const pruned = pruneHiddenData(state);
      expect(pruned['profile']).toBe(profile);
      expect(profile.nickname).toBe('Annie');
    });

    it('removes the value of a hidden input when a visible path only starts with the same text', () => {
      const state = makeState(
        { address: 'Main St', addressNote: 'Ring twice' },
        { search: { hidden: true }, note: {} },
        { search: inputWidget('address'), note: inputWidget('addressNote') },
      );
      expect(pruneHiddenData(state)).toEqual({ addressNote: 'Ring twice' });
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

    // A template input bound to the whole row has the row as its path: `tags.items` -> `tags.1`.
    const plainRowSources = (count: number) => {
      const sources: State['resolvedSources'] = {};
      for (let index = 0; index < count; index++) {
        sources[`tag[${index}]`] = inputWidget(`tags.${index}`);
      }
      return sources;
    };

    // `toEqual` reads an empty slot as `undefined`. `Object.keys` lists the indexes with a value.
    it('leaves an empty slot for a hidden row of plain values and keeps the later rows', () => {
      const state = makeState(
        { tags: ['a', 'b', 'c'] },
        { 'tag[1]': { hidden: true } },
        plainRowSources(3),
      );
      const pruned = pruneHiddenData(state);
      expect(pruned).toEqual({ tags: ['a', undefined, 'c'] });
      expect(Object.keys(pruned['tags'])).toEqual(['0', '2']);
    });

    it('keeps each visible row of plain values at its index when two rows are hidden', () => {
      const state = makeState(
        { tags: ['a', 'b', 'c', 'd'] },
        { 'tag[1]': { hidden: true }, 'tag[2]': { hidden: true } },
        plainRowSources(4),
      );
      const pruned = pruneHiddenData(state);
      expect(pruned).toEqual({ tags: ['a', undefined, undefined, 'd'] });
      expect(Object.keys(pruned['tags'])).toEqual(['0', '3']);
    });

    it('keeps the data at paths no input owns', () => {
      const state = makeState(
        { extra: 'hidden value', notes: { draft: 'x' }, tags: ['a'] },
        { extraField: { hidden: true } },
        { extraField: inputWidget('extra') },
      );
      expect(pruneHiddenData(state)).toEqual({ notes: { draft: 'x' }, tags: ['a'] });
    });
  });
});
