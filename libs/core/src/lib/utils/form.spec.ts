import { describe, expect, it } from 'vitest';
import { type State } from '../store/model';
import {
  type ScopedPathResolvers,
  calculateValidationVariables,
  flattenForm,
  isPotentialScopedPath,
  resolveScopedPath,
  resolveScopedPaths,
} from './form';
import { get } from './object';

describe('utils.form', () => {
  describe('resolveScopedPaths', () => {
    describe('non string values', () => {
      it('should resolve multiple mixed paths in one pass and resolve non string values', () => {
        const ctx = { form: { count: 900 }, meta: { auth: false } };
        const input = '{{$form.count}} and {{$meta.auth}}';
        const result = resolveScopedPaths(input, {
          resolveFormPath: vi.fn((path) => get(ctx.form, path)),
          resolveMetaPath: vi.fn((path) => get(ctx.meta, path)),
          resolveErrorsPath: vi.fn(() => undefined),
          resolveFormIsInvalid: vi.fn(() => false),
        });
        expect(result).toBe('900 and false');
      });
    });

    describe('string values', () => {
      let mockResolvers: ScopedPathResolvers;

      beforeEach(() => {
        mockResolvers = {
          resolveFormPath: vi.fn((path) => `form_val:${path}`),
          resolveMetaPath: vi.fn((path) => `meta_val:${path}`),
          resolveErrorsPath: vi.fn((path) => `errors_val:${path}`),
          resolveFormIsInvalid: vi.fn(() => true),
        };
      });

      it('should resolve a single $form path', () => {
        const result = resolveScopedPaths('User: {{$form.name}}', mockResolvers);
        expect(result).toBe('User: form_val:name');
        expect(mockResolvers.resolveFormPath).toHaveBeenCalledWith('name');
      });

      it('should resolve a single $meta path', () => {
        const result = resolveScopedPaths('Version: {{$meta.v}}', mockResolvers);
        expect(result).toBe('Version: meta_val:v');
        expect(mockResolvers.resolveMetaPath).toHaveBeenCalledWith('v');
      });

      it('should resolve a single $errors path', () => {
        const result = resolveScopedPaths('Error: {{$errors.age}}', mockResolvers);
        expect(result).toBe('Error: errors_val:age');
        expect(mockResolvers.resolveErrorsPath).toHaveBeenCalledWith('age');
      });

      it('should resolve $formIsInvalid', () => {
        const result = resolveScopedPaths('Invalid: {{$formIsInvalid}}', mockResolvers);
        expect(result).toBe('Invalid: true');
        expect(mockResolvers.resolveFormIsInvalid).toHaveBeenCalled();
      });

      it('should resolve multiple mixed paths in one pass', () => {
        const input = '{{$form.user}} is {{$meta.role}}';
        const result = resolveScopedPaths(input, mockResolvers);
        expect(result).toBe('form_val:user is meta_val:role');
      });

      it('should resolve $errors and $formIsInvalid together', () => {
        const input = '{{$errors.email}} - valid: {{$formIsInvalid}}';
        const result = resolveScopedPaths(input, mockResolvers);
        expect(result).toBe('errors_val:email - valid: true');
      });

      it('should handle complex paths with optional chaining', () => {
        const input = '{{$form.profile?.settings?.theme}}';
        const result = resolveScopedPaths(input, mockResolvers);
        expect(result).toBe('form_val:profile?.settings?.theme');
      });

      it('should return original string if no tokens match', () => {
        const input = 'Hello World';
        expect(resolveScopedPaths(input, mockResolvers)).toBe(input);
        expect(mockResolvers.resolveFormPath).not.toHaveBeenCalled();
      });

      it('should ignore unsupported scopes like $other', () => {
        const input = '{{$other.value}} and {{$form.ok}}';
        const result = resolveScopedPaths(input, mockResolvers);
        expect(result).toBe('{{$other.value}} and form_val:ok');
      });

      it('should handle resolver errors gracefully', () => {
        const errorResolvers: ScopedPathResolvers = {
          resolveFormPath: () => {
            throw new Error('Boom');
          },
          resolveMetaPath: () => 'ok',
          resolveErrorsPath: () => 'errors_ok',
          resolveFormIsInvalid: () => false,
        };
        const result = resolveScopedPaths('{{$form.err}} and {{$meta.ok}}', errorResolvers);
        expect(result).toBe('{{$form.err}} and ok');
      });

      it('should handle non-string inputs safely', () => {
        // @ts-expect-error - asas
        expect(resolveScopedPaths(null, mockResolvers)).toBe(null);
        // @ts-expect-error - asdas
        expect(resolveScopedPaths(100, mockResolvers)).toBe(100);
      });
    });
  });

  describe('isPotentialScopedPath', () => {
    it.each([
      ['$form.name', true],
      ['$form.user.address.city', true],
      ['$meta.status', true],
      ['$errors.age', true],
      ['$formIsInvalid', true],
    ])('returns true for valid scoped path "%s"', (input, expected) => {
      expect(isPotentialScopedPath(input)).toBe(expected);
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
      expect(isPotentialScopedPath(input)).toBe(expected);
    });
  });

  describe('resolveScopedPath', () => {
    let mockResolvers: ScopedPathResolvers;

    beforeEach(() => {
      mockResolvers = {
        resolveFormPath: vi.fn((path) => `form:${path}`),
        resolveMetaPath: vi.fn((path) => `meta:${path}`),
        resolveErrorsPath: vi.fn((path) => `errors:${path}`),
        resolveFormIsInvalid: vi.fn(() => false),
      };
    });

    it('resolves a $form.* scoped path by stripping the prefix', () => {
      expect(resolveScopedPath('$form.user.id', mockResolvers)).toBe('form:user.id');
      expect(mockResolvers.resolveFormPath).toHaveBeenCalledWith('user.id');
    });

    it('resolves a $meta.* scoped path by stripping the prefix', () => {
      expect(resolveScopedPath('$meta.my.lang', mockResolvers)).toBe('meta:my.lang');
      expect(mockResolvers.resolveMetaPath).toHaveBeenCalledWith('my.lang');
    });

    it('resolves a $errors.* scoped path by stripping the prefix', () => {
      expect(resolveScopedPath('$errors.user.age', mockResolvers)).toBe('errors:user.age');
      expect(mockResolvers.resolveErrorsPath).toHaveBeenCalledWith('user.age');
    });

    it('resolves the $formIsInvalid scoped path', () => {
      expect(resolveScopedPath('$formIsInvalid', mockResolvers)).toBe(false);
      expect(mockResolvers.resolveFormIsInvalid).toHaveBeenCalled();
    });

    it('returns undefined when providing a sub-path to the $formIsInvalid scope', () => {
      expect(resolveScopedPath('$formIsInvalid.age', mockResolvers)).toBeUndefined();
    });

    it('returns undefined for unrecognised prefixes', () => {
      expect(resolveScopedPath('$something.plainValue', mockResolvers)).toBeUndefined();
      expect(resolveScopedPath('some.more', mockResolvers)).toBeUndefined();
      expect(resolveScopedPath('plainValue', mockResolvers)).toBeUndefined();
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
