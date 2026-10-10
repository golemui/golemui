// @vitest-environment jsdom
import type { PropertyDeclaration, ReactiveElement } from 'lit';
import { tagNameOf } from '@golemui/lit-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { booleanAttribute } from '../utils/converters';
import type { GuiLabel } from './label';
import type { GuiTextinput } from './textinput';

// Attributes that mirror a native form control keep the native spelling.
const NATIVE_ATTRIBUTES: Record<string, string> = { readOnly: 'readonly', maxLength: 'maxlength' };

const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

type ElementProperty = { element: typeof ReactiveElement; property: string; attribute: string };
type PropertyOptions = PropertyDeclaration & { type?: unknown; converter?: unknown };

/** Every attribute property of every exported element class, with its options. */
const loadProperties = async () => {
  const exported: unknown[] = Object.values(await import('../../index'));
  const elements = exported.filter(
    (value): value is typeof ReactiveElement =>
      typeof value === 'function' && 'elementProperties' in value,
  );
  expect(elements.length).toBeGreaterThan(30);

  const properties: (ElementProperty & { options: PropertyOptions })[] = [];
  for (const element of elements) {
    // Reading observedAttributes finalizes the class, which fills elementProperties.
    void element.observedAttributes;
    for (const [property, options] of element.elementProperties as Map<
      PropertyKey,
      PropertyOptions
    >) {
      if (typeof property !== 'string' || options.attribute === false) continue;
      const attribute =
        typeof options.attribute === 'string' ? options.attribute : property.toLowerCase();
      properties.push({ element, property, attribute, options });
    }
  }
  return properties;
};

const render = async <T extends ReactiveElement>(markup: string): Promise<T> => {
  document.body.innerHTML = markup;
  const element = document.body.firstElementChild as T;
  await element.updateComplete;
  return element;
};

afterEach(() => {
  document.body.innerHTML = '';
});

// Every attribute is the kebab-case form of its property, so `<gui-x min-date>` reaches `minDate`.
// Without an explicit `attribute`, Lit would lowercase the name instead (`mindate`).
describe('gui-components attribute names', () => {
  it('are the kebab-case form of their property', { timeout: 30_000 }, async () => {
    const mismatches = (await loadProperties())
      .filter(
        ({ property, attribute }) => attribute !== (NATIVE_ATTRIBUTES[property] ?? kebab(property)),
      )
      .map(({ element, property, attribute }) => `${element.name}.${property}: ${attribute}`);

    expect(mismatches).toEqual([]);
  });
});

// Lit's Boolean converter reads any present attribute as true, so `touched="false"` would show the
// errors. Vue's server renderer writes such attributes for false props.
describe('gui-components boolean attributes', () => {
  it("never use Lit's Boolean converter", { timeout: 30_000 }, async () => {
    const plainBooleans = (await loadProperties())
      .filter(({ options }) => options.type === Boolean && options.converter !== booleanAttribute)
      .map(({ element, property }) => `${element.name}.${property}`);

    expect(plainBooleans).toEqual([]);
  });

  it('read "false" as false and an empty value as true', { timeout: 30_000 }, async () => {
    const booleans = (await loadProperties()).flatMap((entry) => {
      // The abstract base classes have no tag.
      const tagName = tagNameOf(entry.element as unknown as CustomElementConstructor);
      return entry.options.converter === booleanAttribute && tagName ? [{ ...entry, tagName }] : [];
    });
    expect(booleans.length).toBeGreaterThan(100);

    const failures: string[] = [];
    for (const { element, property, attribute, tagName } of booleans) {
      const instance = document.createElement(tagName) as HTMLElement & Record<string, unknown>;

      instance.setAttribute(attribute, 'false');
      if (instance[property] !== false) {
        failures.push(`${element.name}.${property} with "false": ${String(instance[property])}`);
      }

      instance.setAttribute(attribute, '');
      if (instance[property] !== true) {
        failures.push(`${element.name}.${property} with "": ${String(instance[property])}`);
      }
    }

    expect(failures).toEqual([]);
  });

  it('render native="false" on a label without a <label>', async () => {
    await import('./label');
    const label = await render<GuiLabel>(
      '<gui-label uid="l" label="Name" native="false"></gui-label>',
    );

    expect(label.querySelector('label')).toBeNull();
    expect(label.textContent).toContain('Name');
  });

  it('hide the errors with touched="false"', async () => {
    await import('./textinput');
    const field = await render<GuiTextinput>(
      `<gui-textinput uid="t" touched="false" errors='["Too short"]'></gui-textinput>`,
    );
    expect(field.textContent).not.toContain('Too short');

    field.touched = true;
    await field.updateComplete;
    expect(field.textContent).toContain('Too short');
  });
});
