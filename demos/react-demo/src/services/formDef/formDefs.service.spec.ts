import { describe, expect, it } from 'vitest';
import formDefsService, { FormDefs } from './formDefs.service';
import { FormDefFacade, FormDefTuple } from './formDef.domain';

describe('FormDefs - Integration Tests', () => {
  const service: FormDefs = formDefsService;

  describe('hydrate', () => {
    it('should hydrate form definition with form data', () => {
      const formDefRaw: FormDefFacade<{ name: string }> = [
        ['data_inputs', { name: { type: 'text' } }],
      ];
      const formDataRaw = { name: 'John' };

      const result = service.hydrate(formDefRaw, formDataRaw);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([
        ['data_inputs', { name: { type: 'text' } }],
        ['controllers', [{ type: 'button', label: 'Submit', on: { click: 'submit' } }]],
      ]);
    });

    it('should infer field types from form data when formDefRaw is null', () => {
      const formDataRaw = { name: 'John', age: 30 };

      const result = service.hydrate(null, formDataRaw);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([
        [
          'data_inputs',
          {
            name: { type: 'text' },
            age: { type: 'number' },
          },
        ],
        ['controllers', [{ type: 'button', label: 'Submit', on: { click: 'submit' } }]],
      ]);
    });

    it('should use only form definition when formDataRaw is null', () => {
      const formDefRaw: FormDefFacade<{ name: string; email: string }> = [
        ['data_inputs', { name: { type: 'text' }, email: { type: 'text' } }],
      ];

      const result = service.hydrate(formDefRaw, null);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([
        ['data_inputs', { name: { type: 'text' }, email: { type: 'text' } }],
        ['controllers', [{ type: 'button', label: 'Submit', on: { click: 'submit' } }]],
      ]);
    });

    it('should throw error when both formDefRaw and formDataRaw are null', () => {
      expect(() => service.hydrate(null, null)).toThrow(
        'Form definition and form data cannot both be null',
      );
    });

    it('should merge partial form definition with form data', () => {
      const formDefRaw: FormDefFacade<{ name: string; age: number }> = [
        ['data_inputs', { name: { type: 'text' } }],
      ];
      const formDataRaw = { name: 'John', age: 30 };

      const result = service.hydrate(formDefRaw, formDataRaw);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([
        ['data_inputs', { name: { type: 'text' }, age: { type: 'number' } }],
        ['controllers', [{ type: 'button', label: 'Submit', on: { click: 'submit' } }]],
      ]);
    });

    it('should handle complex form definitions with multiple data_inputs tuples', () => {
      const formDefRaw: FormDefFacade<{ username: string; email: string; age: number }> = [
        ['data_inputs', { username: { type: 'text' }, email: { type: 'text' } }],
        ['data_inputs', { age: { type: 'number' } }],
      ];
      const formDataRaw = { username: 'johndoe', email: 'john@example.com', age: 25 };

      const result = service.hydrate(formDefRaw, formDataRaw);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([
        [
          'data_inputs',
          {
            username: { type: 'text' },
            email: { type: 'text' },
            age: { type: 'number' },
          },
        ],
        ['controllers', [{ type: 'button', label: 'Submit', on: { click: 'submit' } }]],
      ]);
    });

    it('should handle DataInputDefsByKey format (object instead of tuple array)', () => {
      const formDefRaw = { name: { type: 'text' as const }, age: { type: 'number' as const } };
      const formDataRaw = { name: 'Alice', age: 28 };

      const result = service.hydrate(formDefRaw, formDataRaw);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([
        ['data_inputs', { name: { type: 'text' }, age: { type: 'number' } }],
        ['controllers', [{ type: 'button', label: 'Submit', on: { click: 'submit' } }]],
      ]);
    });
  });
});
