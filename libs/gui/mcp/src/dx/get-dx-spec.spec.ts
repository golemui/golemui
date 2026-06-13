import { describe, expect, it } from 'vitest';
import { getDxSpec } from './get-dx-spec';

describe('dx_get_spec', () => {
  it('returns signature, example, and notes for a factory', () => {
    const r = getDxSpec({ factory: 'textInput' });
    expect(r.factory).toBe('textInput');
    expect(r.namespace).toBe('inputs');
    expect(r.example).toContain('gui.inputs.textInput');
    expect(r.notes.length).toBeGreaterThan(0);
  });

  it('is lean — does NOT re-ship the common note or patterns (those live in dx_list_factories)', () => {
    const r = getDxSpec({ factory: 'textInput' }) as Record<string, unknown>;
    expect(r.common).toBeUndefined();
    expect(r.patterns).toBeUndefined();
  });

  it('surfaces the wart guidance on dropdown', () => {
    const r = getDxSpec({ factory: 'dropdown' });
    expect(r.notes.join(' ')).toMatch(/typed.*validator|type: 'string'/);
  });

  it('throws on unknown factory with the list of known ones', () => {
    expect(() => getDxSpec({ factory: 'nope' })).toThrow(/textInput/);
  });
});
