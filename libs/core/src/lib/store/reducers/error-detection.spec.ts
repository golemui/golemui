import { describe, expect, it } from 'vitest';
import { errorCodes } from '../../errors';
import { detectMalformedFormShape } from './error-detection';

// Both APIs share a single silent-failure: an extra `{ form: ... }` wrapper around the actual
// definition type-checks but is never resolved, so the form renders blank. detectMalformedFormShape
// must catch both origins and return the matching, self-fixing suggestion.
describe('detectMalformedFormShape', () => {
  const dxItem = (itemType: string) => ({ type: 'ITEMS', itemType });

  describe('DX origin — unresolved gui.* items leaked to core', () => {
    it('catches `{ form: [gui.* items] }`', () => {
      const health = detectMalformedFormShape({ form: [dxItem('textInput')] });
      expect(health).toMatchObject({
        status: 'errored',
        code: errorCodes.initializeMalformedFormShapeError,
      });
      expect(health?.status === 'errored' && health.message).toContain('DX fix');
      expect(health?.status === 'errored' && health.message).toContain('formConfig');
      expect(health?.status === 'errored' && health.message).toContain('Do NOT wrap');
    });

    it('catches `form` as a single unresolved gui.* item', () => {
      const health = detectMalformedFormShape({ form: dxItem('textInput') });
      expect(health).toMatchObject({
        status: 'errored',
        code: errorCodes.initializeMalformedFormShapeError,
      });
      expect(health?.status === 'errored' && health.message).toContain('DX fix');
    });
  });

  describe('JSON origin — double-wrapped form', () => {
    it('catches `{ form: { states, form: [...] } }`', () => {
      const health = detectMalformedFormShape({
        form: {
          states: {},
          form: [{ uid: 'name', kind: 'input', type: 'text', path: 'name' }],
        },
      });
      expect(health).toMatchObject({
        status: 'errored',
        code: errorCodes.initializeMalformedFormShapeError,
      });
      expect(health?.status === 'errored' && health.message).toContain('JSON fix');
      expect(health?.status === 'errored' && health.message).toContain('Do NOT wrap');
    });
  });

  describe('valid shapes — returns null', () => {
    it('bare-array form (auto-wrapped by the reducer)', () => {
      expect(
        detectMalformedFormShape({
          form: [{ uid: 'name', kind: 'input', type: 'text', path: 'name' }],
        }),
      ).toBeNull();
    });

    it('resolved layout widget as form', () => {
      expect(
        detectMalformedFormShape({
          form: { uid: '', kind: 'layout', type: 'flex', children: [] },
        }),
      ).toBeNull();
    });

    it('non-object / array inputs', () => {
      expect(detectMalformedFormShape(undefined)).toBeNull();
      expect(detectMalformedFormShape(null)).toBeNull();
      expect(detectMalformedFormShape('{"form":[]}')).toBeNull();
      expect(detectMalformedFormShape([])).toBeNull();
    });
  });
});
