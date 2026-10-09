// @vitest-environment jsdom
import type { PropertyDeclaration, ReactiveElement } from 'lit';
import { describe, expect, it } from 'vitest';

// Attributes that mirror a native form control keep the native spelling.
const NATIVE_ATTRIBUTES: Record<string, string> = { readOnly: 'readonly', maxLength: 'maxlength' };

const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

// Every attribute is the kebab-case form of its property, so `<gui-x min-date>` reaches `minDate`.
// Without an explicit `attribute`, Lit would lowercase the name instead (`mindate`).
describe('gui-components attribute names', () => {
  it('are the kebab-case form of their property', { timeout: 30_000 }, async () => {
    const exported: unknown[] = Object.values(await import('../../index'));
    const elements = exported.filter(
      (value): value is typeof ReactiveElement =>
        typeof value === 'function' && 'elementProperties' in value,
    );
    expect(elements.length).toBeGreaterThan(30);

    const mismatches: string[] = [];
    for (const element of elements) {
      // Reading observedAttributes finalizes the class, which fills elementProperties.
      void element.observedAttributes;
      for (const [property, options] of element.elementProperties as Map<
        PropertyKey,
        PropertyDeclaration
      >) {
        if (typeof property !== 'string' || options.attribute === false) continue;
        const actual =
          typeof options.attribute === 'string' ? options.attribute : property.toLowerCase();
        const expected = NATIVE_ATTRIBUTES[property] ?? kebab(property);
        if (actual !== expected) mismatches.push(`${element.name}.${property}: ${actual}`);
      }
    }

    expect(mismatches).toEqual([]);
  });
});
