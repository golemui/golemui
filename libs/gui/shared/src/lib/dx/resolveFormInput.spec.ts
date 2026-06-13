import { describe, expect, it } from 'vitest';
import { resolveFormInput } from './resolveFormInput';

// A gui.* shortcut carries `type: 'ITEMS'` + an `itemType` until resolveFormInput expands it.
const dxItem = (itemType: string) => ({ type: 'ITEMS', itemType });

describe('resolveFormInput - wrapped gui.* guard', () => {
  it('throws when a gui.* array is wrapped in an extra `{ form: ... }` object', () => {
    expect(() => resolveFormInput({ form: [dxItem('inputs')] })).toThrow(/Do NOT wrap them/);
  });

  it('throws when a single gui.* item is wrapped in `{ form: ... }`', () => {
    expect(() => resolveFormInput({ form: dxItem('inputs') })).toThrow(
      /extra `\{ form: \.\.\. \}`/,
    );
  });

  it('passes a plain JSON form definition through untouched', () => {
    const jsonForm = {
      states: {},
      form: [{ uid: 'name', kind: 'input', type: 'text', path: 'name' }],
    };
    expect(resolveFormInput(jsonForm)).toEqual({ formDef: jsonForm });
  });

  it('does not throw for the JSON double-wrap (left for the core decoder to reject)', () => {
    const doubleWrapped = {
      form: { states: {}, form: [{ uid: 'name', kind: 'input', type: 'text', path: 'name' }] },
    };
    expect(() => resolveFormInput(doubleWrapped)).not.toThrow();
  });
});
