// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GuiFormControl } from '../gui-form-control';
import './checkbox';
import './currency';
import './markdown';
import './number';
import './password';
import './radiogroup';
import './select';
import './textarea';
import './textinput';
import './toggle';

const render = async <T extends GuiFormControl>(markup: string): Promise<T> => {
  document.body.innerHTML = markup;
  const element = document.body.firstElementChild as T;
  await element.updateComplete;
  return element;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('the disabled property', () => {
  it('sets and removes the attribute, which the browser reads', async () => {
    const field = await render('<gui-textinput name="email"></gui-textinput>');

    field.disabled = true;
    expect(field.hasAttribute('disabled')).toBe(true);

    field.disabled = false;
    expect(field.hasAttribute('disabled')).toBe(false);
  });

  it('follows the attribute', async () => {
    const field = await render('<gui-textinput name="email" disabled></gui-textinput>');
    expect(field.disabled).toBe(true);

    field.removeAttribute('disabled');
    expect(field.disabled).toBe(false);
  });

  it("never reflects a disabled fieldset's state", async () => {
    const field = await render('<gui-textinput name="email"></gui-textinput>');

    field.formDisabledCallback(true);
    expect(field.disabled).toBe(true);
    expect(field.hasAttribute('disabled')).toBe(false);

    field.formDisabledCallback(false);
    expect(field.disabled).toBe(false);
  });
});

// The inner controls sit in the same <form> as the element. A constraint on them would make the
// browser validate them too: with or without a name, in its own language, and for number inputs
// against step 1, which rejects any decimal.
describe('the native controls inside an element', () => {
  const elements = [
    'gui-textinput',
    'gui-password',
    'gui-number minimum="1" maximum="9" step="2"',
    'gui-currency step="0.5"',
    'gui-textarea',
    'gui-markdown',
    'gui-checkbox',
    'gui-toggle',
    `gui-select options='["a", "b"]'`,
    `gui-radiogroup options='["a", "b"]'`,
  ];

  it.each(elements)('carry no constraint attributes: <%s required>', async (element) => {
    const tag = element.split(' ')[0];
    const field = await render(`<${element} name="field" required></${tag}>`);

    const controls = [...field.querySelectorAll('input, select, textarea')];
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      for (const attribute of ['required', 'min', 'max', 'minlength', 'pattern']) {
        expect(control.hasAttribute(attribute), `${tag} ${control.localName}[${attribute}]`).toBe(
          false,
        );
      }
      if (control.getAttribute('type') === 'number') {
        expect(control.getAttribute('step'), `${tag} step`).toBe('any');
      }
    }
  });

  it('give the bounds of a number to assistive technology', async () => {
    const field = await render('<gui-number minimum="1" maximum="9"></gui-number>');
    const input = field.querySelector('input');

    expect(input?.getAttribute('aria-valuemin')).toBe('1');
    expect(input?.getAttribute('aria-valuemax')).toBe('9');
  });
});
