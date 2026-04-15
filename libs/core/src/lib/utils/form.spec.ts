import { describe, expect, it } from 'vitest';
import { State } from '../store/model';
import {
  ExprVarResolvers,
  calculateValidationVariables,
  exprVarResolver,
  flattenForm,
  isPotentialExprVar,
  resolveExprVars,
} from './form';
import { get } from './object';

describe('utils.form', () => {
  describe('resolveExprVars', () => {
    describe('non string values', () => {
      it('should resolve multiple mixed paths in one pass and resolve non string values', () => {
        const ctx = { form: { count: 900 }, meta: { auth: false } };
        const input = '{{$form.count}} and {{$meta.auth}}';
        const result = resolveExprVars(input, {
          resolveFormVar: vi.fn((path) => get(ctx.form, path)),
          resolveMetaVar: vi.fn((path) => get(ctx.meta, path)),
          resolveErrorsVar: vi.fn(() => undefined),
          resolveFormIsInvalidVar: vi.fn(() => false),
        });
        expect(result).toBe('900 and false');
      });
    });

    describe('string values', () => {
      let mockResolvers: ExprVarResolvers;

      beforeEach(() => {
        mockResolvers = {
          resolveFormVar: vi.fn((path) => `form_val:${path}`),
          resolveMetaVar: vi.fn((path) => `meta_val:${path}`),
          resolveErrorsVar: vi.fn((path) => `errors_val:${path}`),
          resolveFormIsInvalidVar: vi.fn(() => true),
        };
      });

      it('should resolve a single $form path', () => {
        const result = resolveExprVars('User: {{$form.name}}', mockResolvers);
        expect(result).toBe('User: form_val:name');
        expect(mockResolvers.resolveFormVar).toHaveBeenCalledWith('name');
      });

      it('should resolve a single $meta path', () => {
        const result = resolveExprVars('Version: {{$meta.v}}', mockResolvers);
        expect(result).toBe('Version: meta_val:v');
        expect(mockResolvers.resolveMetaVar).toHaveBeenCalledWith('v');
      });

      it('should resolve a single $errors path', () => {
        const result = resolveExprVars('Error: {{$errors.age}}', mockResolvers);
        expect(result).toBe('Error: errors_val:age');
        expect(mockResolvers.resolveErrorsVar).toHaveBeenCalledWith('age');
      });

      it('should resolve $formIsInvalid', () => {
        const result = resolveExprVars('Invalid: {{$formIsInvalid}}', mockResolvers);
        expect(result).toBe('Invalid: true');
        expect(mockResolvers.resolveFormIsInvalidVar).toHaveBeenCalled();
      });

      it('should resolve multiple mixed paths in one pass', () => {
        const input = '{{$form.user}} is {{$meta.role}}';
        const result = resolveExprVars(input, mockResolvers);
        expect(result).toBe('form_val:user is meta_val:role');
      });

      it('should resolve $errors and $formIsInvalid together', () => {
        const input = '{{$errors.email}} - valid: {{$formIsInvalid}}';
        const result = resolveExprVars(input, mockResolvers);
        expect(result).toBe('errors_val:email - valid: true');
      });

      it('should handle complex paths with optional chaining', () => {
        const input = '{{$form.profile?.settings?.theme}}';
        const result = resolveExprVars(input, mockResolvers);
        expect(result).toBe('form_val:profile?.settings?.theme');
      });

      it('should return original string if no tokens match', () => {
        const input = 'Hello World';
        expect(resolveExprVars(input, mockResolvers)).toBe(input);
        expect(mockResolvers.resolveFormVar).not.toHaveBeenCalled();
      });

      it('should ignore unsupported scopes like $other', () => {
        const input = '{{$other.value}} and {{$form.ok}}';
        const result = resolveExprVars(input, mockResolvers);
        expect(result).toBe('{{$other.value}} and form_val:ok');
      });

      it('should handle resolver errors gracefully', () => {
        const errorResolvers: ExprVarResolvers = {
          resolveFormVar: () => {
            throw new Error('Boom');
          },
          resolveMetaVar: () => 'ok',
          resolveErrorsVar: () => 'errors_ok',
          resolveFormIsInvalidVar: () => false,
        };
        const result = resolveExprVars('{{$form.err}} and {{$meta.ok}}', errorResolvers);
        expect(result).toBe('{{$form.err}} and ok');
      });

      it('should handle non-string inputs safely', () => {
        // @ts-expect-error - asas
        expect(resolveExprVars(null, mockResolvers)).toBe(null);
        // @ts-expect-error - asdas
        expect(resolveExprVars(100, mockResolvers)).toBe(100);
      });
    });
  });

  describe('isPotentialExprVar', () => {
    it.each([
      ['$form.name', true],
      ['$form.user.address.city', true],
      ['$meta.status', true],
      ['$errors.age', true],
      ['$formIsInvalid', true],
    ])('returns true for valid expression variable "%s"', (input, expected) => {
      expect(isPotentialExprVar(input)).toBe(expected);
    });

    it.each([
      ['name', false, 'no prefix'],
      ['$form', false, 'prefix without dot or path'],
      ['$meta', false, 'prefix without dot or path'],
      ['$form.user name', false, 'contains a space'],
      ['$other.value', false, 'unsupported prefix'],
      ['', false, 'empty string'],
      [123, false, 'number'],
      [null, false, 'null'],
      [undefined, false, 'undefined'],
    ])('returns false for "%s" (%s)', (input, expected, _reason) => {
      expect(isPotentialExprVar(input)).toBe(expected);
    });
  });

  describe('exprVarResolver', () => {
    let mockResolvers: ExprVarResolvers;

    beforeEach(() => {
      mockResolvers = {
        resolveFormVar: vi.fn((path) => `form:${path}`),
        resolveMetaVar: vi.fn((path) => `meta:${path}`),
        resolveErrorsVar: vi.fn((path) => `errors:${path}`),
        resolveFormIsInvalidVar: vi.fn(() => false),
      };
    });

    it('resolves a $form.* variable by stripping the prefix', () => {
      expect(exprVarResolver('$form.user.id', mockResolvers)).toBe('form:user.id');
      expect(mockResolvers.resolveFormVar).toHaveBeenCalledWith('user.id');
    });

    it('resolves a $meta.* variable by stripping the prefix', () => {
      expect(exprVarResolver('$meta.my.lang', mockResolvers)).toBe('meta:my.lang');
      expect(mockResolvers.resolveMetaVar).toHaveBeenCalledWith('my.lang');
    });

    it('resolves a $errors.* variable by stripping the prefix', () => {
      expect(exprVarResolver('$errors.user.age', mockResolvers)).toBe('errors:user.age');
      expect(mockResolvers.resolveErrorsVar).toHaveBeenCalledWith('user.age');
    });

    it('resolves a $formIsInvalid variable', () => {
      expect(exprVarResolver('$formIsInvalid', mockResolvers)).toBe(false);
      expect(mockResolvers.resolveFormIsInvalidVar).toHaveBeenCalled();
    });

    it('returns undefined when providing a path to the $formIsInvalid variable', () => {
      expect(exprVarResolver('$formIsInvalid.age', mockResolvers)).toBeUndefined();
    });

    it('returns undefined for unrecognised prefixes', () => {
      expect(exprVarResolver('$something.plainValue', mockResolvers)).toBeUndefined();
      expect(exprVarResolver('some.more', mockResolvers)).toBeUndefined();
      expect(exprVarResolver('plainValue', mockResolvers)).toBeUndefined();
    });
  });

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
