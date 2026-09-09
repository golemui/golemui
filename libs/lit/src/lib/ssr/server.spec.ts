import { describe, expect, it } from 'vitest';
import { stripFalseBooleanAttributes } from './server';

describe('stripFalseBooleanAttributes', () => {
  it('removes a false-valued selected attribute and a false-valued checked attribute', () => {
    expect(stripFalseBooleanAttributes('<option value="free" selected="false">Free</option>')).toBe(
      '<option value="free">Free</option>',
    );
    expect(stripFalseBooleanAttributes('<input type="checkbox" checked="false">')).toBe(
      '<input type="checkbox">',
    );
  });

  it('removes every false-valued boolean attribute in one tag', () => {
    expect(
      stripFalseBooleanAttributes(
        '<input disabled="false" hidden="false" required="false" value="x">',
      ),
    ).toBe('<input value="x">');
  });

  it('handles a self-closing tag and attributes split across lines', () => {
    expect(stripFalseBooleanAttributes('<input checked="false"/>')).toBe('<input/>');
    expect(stripFalseBooleanAttributes('<input\n  type="radio"\n  checked="false"\n/>')).toBe(
      '<input\n  type="radio"\n/>',
    );
  });

  it('keeps aria and data attributes whose value is the string false', () => {
    const markup = '<li aria-selected="false" aria-disabled="false" data-resumed="false"></li>';
    expect(stripFalseBooleanAttributes(markup)).toBe(markup);
  });

  it('keeps enumerated attributes where false is a real value', () => {
    const markup = '<div draggable="false" spellcheck="false" contenteditable="false"></div>';
    expect(stripFalseBooleanAttributes(markup)).toBe(markup);
  });

  it('keeps true-valued, empty and bare boolean attributes', () => {
    const markup =
      '<input checked="true"><input checked=""><input checked><option selected>A</option>';
    expect(stripFalseBooleanAttributes(markup)).toBe(markup);
  });

  it('keeps text content that contains the same characters', () => {
    const escaped = '<p>checked=&quot;false&quot;</p>';
    expect(stripFalseBooleanAttributes(escaped)).toBe(escaped);
    const literal = '<p>an attribute checked="false" in text</p>';
    expect(stripFalseBooleanAttributes(literal)).toBe(literal);
  });

  it('returns markup without boolean attributes unchanged', () => {
    const markup =
      '<gui-core-form class="gui-form" defer-hydration><form id="f"><input value="Ada"></form></gui-core-form>';
    expect(stripFalseBooleanAttributes(markup)).toBe(markup);
  });
});
