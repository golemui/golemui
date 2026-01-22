import { describe, expect, it } from 'vitest';
import formDefsService, { FormDefs } from './formDefs.service';
import { FormDefFacade } from './formDef.domain';

describe('FormDefs - Integration Tests', () => {
  const service: FormDefs = formDefsService;

  describe('hydrate', () => {
    it('should hydrate form definition', () => {
      const formDefRaw: FormDefFacade<{ name: string }> = [
        ['data_inputs', { name: { type: 'text' } }],
      ];

      const result = service.convertIntoTuples(formDefRaw);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([
        ['data_inputs', { name: { type: 'text' } }],
        ['controllers', [{ type: 'button', label: 'Submit', on: { click: 'submit' } }]],
      ]);
    });

    it('should use only form definition', () => {
      const formDefRaw: FormDefFacade<{ name: string; email: string }> = [
        ['data_inputs', { name: { type: 'text' }, email: { type: 'text' } }],
      ];

      const result = service.convertIntoTuples(formDefRaw);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([
        ['data_inputs', { name: { type: 'text' }, email: { type: 'text' } }],
        ['controllers', [{ type: 'button', label: 'Submit', on: { click: 'submit' } }]],
      ]);
    });

    it('should throw error when formDefRaw is null', () => {
      expect(() => service.convertIntoTuples(null)).toThrow('Form definition cannot be null');
    });

    it('should handle complex form definitions with multiple data_inputs tuples', () => {
      const formDefRaw: FormDefFacade<{ username: string; email: string; age: number }> = [
        ['data_inputs', { username: { type: 'text' }, email: { type: 'text' } }],
        ['data_inputs', { age: { type: 'number' } }],
      ];

      const result = service.convertIntoTuples(formDefRaw);

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

      const result = service.convertIntoTuples(formDefRaw);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([
        ['data_inputs', { name: { type: 'text' }, age: { type: 'number' } }],
        ['controllers', [{ type: 'button', label: 'Submit', on: { click: 'submit' } }]],
      ]);
    });
  });
});
