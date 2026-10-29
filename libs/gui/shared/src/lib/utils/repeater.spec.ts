import { describe, expect, it, vi } from 'vitest';
import { getItemKey, repeaterIndexSuffix } from './repeater';

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

describe('getItemKey', () => {
  const createIncrementer = () => {
    let lastId = 0;
    const next = vi.fn(() => ++lastId);
    return next;
  };

  it('returns the same key for the same object and calls the incrementer once', () => {
    const next = createIncrementer();
    const item = { name: 'Alice' };

    expect(getItemKey(item, next)).toBe(1);
    expect(getItemKey(item, next)).toBe(1);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns different keys for different objects', () => {
    const next = createIncrementer();

    expect(getItemKey({ name: 'Alice' }, next)).not.toBe(getItemKey({ name: 'Bob' }, next));
  });

  it('does not show the key in Object.keys or JSON.stringify', () => {
    const item = { name: 'Alice' };
    getItemKey(item, createIncrementer());

    expect(Object.keys(item)).toEqual(['name']);
    expect(JSON.stringify(item)).toBe('{"name":"Alice"}');
  });

  it('gives a spread copy of a keyed object a new key', () => {
    const next = createIncrementer();
    const item = { name: 'Alice' };
    const originalKey = getItemKey(item, next);

    expect(getItemKey({ ...item }, next)).not.toBe(originalKey);
  });
});
