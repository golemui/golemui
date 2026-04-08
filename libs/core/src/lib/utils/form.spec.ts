import { describe, expect, it } from 'vitest';
import { resolveScopePaths, ScopeResolvers } from './form';
import { get } from './object';

describe('resolveScopePaths', () => {
  describe('non string values', () => {
    it('should resolve multiple mixed paths in one pass and resolve non string values', () => {
      const ctx = { form: { count: 900 }, meta: { auth: false } };
      const input = '{{$form.count}} and {{$meta.auth}}';
      const result = resolveScopePaths(input, {
        resolveFormScope: vi.fn((path) => get(ctx.form, path)),
        resolveMetaScope: vi.fn((path) => get(ctx.meta, path)),
      });
      expect(result).toBe('900 and false');
    });
  });

  describe('string values', () => {
    let mockResolvers: ScopeResolvers;

    beforeEach(() => {
      mockResolvers = {
        resolveFormScope: vi.fn((path) => `form_val:${path}`),
        resolveMetaScope: vi.fn((path) => `meta_val:${path}`),
      };
    });

    it('should resolve a single $form path', () => {
      const result = resolveScopePaths('User: {{$form.name}}', mockResolvers);
      expect(result).toBe('User: form_val:name');
      expect(mockResolvers.resolveFormScope).toHaveBeenCalledWith('name');
    });

    it('should resolve a single $meta path', () => {
      const result = resolveScopePaths('Version: {{$meta.v}}', mockResolvers);
      expect(result).toBe('Version: meta_val:v');
      expect(mockResolvers.resolveMetaScope).toHaveBeenCalledWith('v');
    });

    it('should resolve multiple mixed paths in one pass', () => {
      const input = '{{$form.user}} is {{$meta.role}}';
      const result = resolveScopePaths(input, mockResolvers);
      expect(result).toBe('form_val:user is meta_val:role');
    });

    it('should handle complex paths with optional chaining', () => {
      const input = '{{$form.profile?.settings?.theme}}';
      const result = resolveScopePaths(input, mockResolvers);
      expect(result).toBe('form_val:profile?.settings?.theme');
    });

    it('should return original string if no tokens match', () => {
      const input = 'Hello World';
      expect(resolveScopePaths(input, mockResolvers)).toBe(input);
      expect(mockResolvers.resolveFormScope).not.toHaveBeenCalled();
    });

    it('should ignore unsupported scopes like $other', () => {
      const input = '{{$other.value}} and {{$form.ok}}';
      const result = resolveScopePaths(input, mockResolvers);
      expect(result).toBe('{{$other.value}} and form_val:ok');
    });

    it('should handle resolver errors gracefully', () => {
      const errorResolvers: ScopeResolvers = {
        resolveFormScope: () => {
          throw new Error('Boom');
        },
        resolveMetaScope: () => 'ok',
      };
      const result = resolveScopePaths('{{$form.err}} and {{$meta.ok}}', errorResolvers);
      expect(result).toBe('{{$form.err}} and ok');
    });

    it('should handle non-string inputs safely', () => {
      // @ts-expect-error - asas
      expect(resolveScopePaths(null, mockResolvers)).toBe(null);
      // @ts-expect-error - asdas
      expect(resolveScopePaths(100, mockResolvers)).toBe(100);
    });
  });
});
