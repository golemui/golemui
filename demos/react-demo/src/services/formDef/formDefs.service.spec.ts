import { describe, expect, it } from 'vitest';
import formDefsService, { FormDefs } from './formDefs.service';
import { FormDefFacade } from './formDef.domain';

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
        ['data_inputs', { name: { type: 'text' } }],
        ['data_inputs', { age: { type: 'number' } }],
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
        ['data_inputs', { name: { type: 'text' } }],
        ['data_inputs', { email: { type: 'text' } }],
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
        ['data_inputs', { name: { type: 'text' } }],
        ['data_inputs', { age: { type: 'number' } }],
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
        ['data_inputs', { username: { type: 'text' } }],
        ['data_inputs', { email: { type: 'text' } }],
        ['data_inputs', { age: { type: 'number' } }],
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
        ['data_inputs', { name: { type: 'text' } }],
        ['data_inputs', { age: { type: 'number' } }],
        ['controllers', [{ type: 'button', label: 'Submit', on: { click: 'submit' } }]],
      ]);
    });

    it('should preserve order when form definition has fewer fields than form data', () => {
      const formDefRaw: FormDefFacade<{ email: string; name: string; age: number }> = [
        ['data_inputs', { email: { type: 'text' } }],
      ];
      const formDataRaw = { email: 'test@test.com', name: 'Bob', age: 35 };

      const result = service.hydrate(formDefRaw, formDataRaw);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      // Extract just the keys from data_inputs tuples to verify order
      const dataInputTuples = result.filter((tuple) => tuple[0] === 'data_inputs');
      const keys = dataInputTuples.flatMap((tuple) => Object.keys(tuple[1]));

      expect(keys).toEqual(['email', 'name', 'age']);
    });

    it('should handle form data with only string values', () => {
      const formDataRaw = { firstName: 'Jane', lastName: 'Doe', city: 'Boston' };

      const result = service.hydrate(null, formDataRaw);

      expect(result).toBeDefined();
      const dataInputTuples = result.filter((tuple) => tuple[0] === 'data_inputs');

      dataInputTuples.forEach((tuple) => {
        const fieldDef = Object.values(tuple[1])[0];
        expect(fieldDef.type).toBe('text');
      });
    });

    it('should handle form data with only number values', () => {
      const formDataRaw = { score: 100, count: 5, rating: 4.5 };

      const result = service.hydrate(null, formDataRaw);

      expect(result).toBeDefined();
      const dataInputTuples = result.filter((tuple) => tuple[0] === 'data_inputs');

      dataInputTuples.forEach((tuple) => {
        const fieldDef = Object.values(tuple[1])[0];
        expect(fieldDef.type).toBe('number');
      });
    });

    it('should handle mixed string and number form data', () => {
      const formDataRaw = { name: 'Test', age: 25, email: 'test@test.com', score: 95.5 };

      const result = service.hydrate(null, formDataRaw);

      expect(result).toBeDefined();
      const dataInputs = result
        .filter((tuple) => tuple[0] === 'data_inputs')
        .reduce((acc, tuple) => ({ ...acc, ...tuple[1] }), {});

      expect(dataInputs).toEqual({
        name: { type: 'text' },
        age: { type: 'number' },
        email: { type: 'text' },
        score: { type: 'number' },
      });
    });
  });
});
