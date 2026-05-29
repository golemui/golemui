import { describe, expect, it } from 'vitest';
import { type State } from '../store/model';
import { calculateValidationVariables, flattenForm } from './form';
import { get } from './object';

describe('utils.form', () => {
  describe('flattenForm', () => {
    const textWidget = (name: string) => ({ type: 'text', kind: 'input', name }) as any;
    const layoutWidget = (name: string, children: any[]) =>
      ({ type: 'layout', kind: 'layout', name, children }) as any;

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
    const makeState = (validations: State['validations']) => ({ validations }) as any;

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
});
