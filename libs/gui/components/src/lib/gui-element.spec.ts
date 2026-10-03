// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { GuiElement } from './gui-element';

class TestElement extends GuiElement {}
customElements.define('gui-test-element', TestElement);

describe('GuiElement uid', () => {
  it('generates an id from the tag name when uid is not set', () => {
    const element = document.createElement('gui-test-element') as TestElement;

    expect(element.uid).toMatch(/^gui-test-element-\d+$/);
  });

  it('keeps the generated id for the lifetime of the element', () => {
    const element = document.createElement('gui-test-element') as TestElement;

    expect(element.uid).toBe(element.uid);
  });

  it('generates a different id for each element', () => {
    const first = document.createElement('gui-test-element') as TestElement;
    const second = document.createElement('gui-test-element') as TestElement;

    expect(first.uid).not.toBe(second.uid);
  });

  it('uses the uid set as a property or an attribute', () => {
    const byProperty = document.createElement('gui-test-element') as TestElement;
    byProperty.uid = 'email';
    const byAttribute = document.createElement('gui-test-element') as TestElement;
    byAttribute.setAttribute('uid', 'phone');

    expect(byProperty.uid).toBe('email');
    expect(byAttribute.uid).toBe('phone');
  });

  it('falls back to the generated id when uid is cleared', () => {
    const element = document.createElement('gui-test-element') as TestElement;
    const generated = element.uid;
    element.uid = 'email';
    element.uid = undefined;

    expect(element.uid).toBe(generated);
  });
});
