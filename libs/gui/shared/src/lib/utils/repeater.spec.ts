import { describe, expect, it } from 'vitest';
import { repeaterIndexSuffix } from './repeater';

describe('repeaterIndexSuffix', () => {
  it('returns an empty string for a uid outside a repeater', () => {
    expect(repeaterIndexSuffix('tabs')).toBe('');
  });

  it('returns the single row index of a uid inside a repeater', () => {
    expect(repeaterIndexSuffix('tabs[0]')).toBe('[0]');
  });

  it('returns the full index chain of a uid inside nested repeaters', () => {
    expect(repeaterIndexSuffix('tabs[2][1]')).toBe('[2][1]');
  });

  it('ignores an index that is not at the end of the uid', () => {
    expect(repeaterIndexSuffix('tabs[2]main')).toBe('');
  });
});
