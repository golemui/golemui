// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { ensureId, setIfMissing, syncAttribute } from './attributes';

describe('attribute helpers', () => {
  it('gives an element an id only when it has none', () => {
    const element = document.createElement('div');
    const id = ensureId(element, 'tab');
    expect(id).toMatch(/^gui-tab-\d+$/);
    expect(ensureId(element, 'tab')).toBe(id);

    element.id = 'app-id';
    expect(ensureId(element, 'tab')).toBe('app-id');
  });

  it('sets an attribute only when the element has none', () => {
    const element = document.createElement('div');
    setIfMissing(element, 'role', 'menu');
    expect(element.getAttribute('role')).toBe('menu');
    setIfMissing(element, 'role', 'listbox');
    expect(element.getAttribute('role')).toBe('menu');
  });

  it('sets, keeps or removes an attribute to match a value', () => {
    const element = document.createElement('div');
    syncAttribute(element, 'tabindex', '0');
    expect(element.getAttribute('tabindex')).toBe('0');
    syncAttribute(element, 'tabindex', null);
    expect(element.hasAttribute('tabindex')).toBe(false);
  });
});
