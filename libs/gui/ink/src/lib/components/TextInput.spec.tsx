import { cleanup } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bracketedPaste, focusedLine, keys, renderForm } from '../spec-helpers/render-form';

// Built from code points so the source stays ASCII. The woman technologist emoji is two code points
// joined by a zero width joiner, five UTF-16 units that the user sees as one character.
const WOMAN_TECHNOLOGIST = String.fromCodePoint(0x1f469, 0x200d, 0x1f4bb);

const nameForm = {
  form: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'name', label: 'Name' }],
};

describe('the textinput widget', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the label and the stored value', async () => {
    const form = await renderForm({
      formDef: {
        form: [
          {
            uid: 'email',
            kind: 'input',
            type: 'textinput',
            path: 'email',
            label: 'Email',
          },
        ],
      },
      data: { email: 'joan@example.com' },
    });

    await vi.waitFor(() => {
      expect(form.frame()).toContain('Email');
      expect(form.frame()).toContain('joan@example.com');
    });
  });

  it('shows the required error after leaving the field empty', async () => {
    const form = await renderForm({
      formDef: {
        form: [
          {
            uid: 'name',
            kind: 'input',
            type: 'textinput',
            path: 'name',
            label: 'Name',
            validator: { type: 'string', required: true },
          },
          {
            uid: 'city',
            kind: 'input',
            type: 'textinput',
            path: 'city',
            label: 'City',
          },
        ],
      },
      // Without a stored value the string validator reports a type error instead of the
      // required message, so the field starts as an empty string.
      data: { name: '' },
    });

    expect(form.frame()).not.toContain('This field is required');

    await form.press(keys.tab);

    await vi.waitFor(() => expect(form.frame()).toContain('This field is required'));
  });

  it('edits inside the value with the caret keys', async () => {
    const form = await renderForm({ formDef: nameForm, data: { name: 'abc' } });
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> abc_'));

    await form.press(keys.left);
    await form.press(keys.left);
    await form.press('X');
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> aX_bc'));

    await form.press(keys.home);
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> _aXbc'));

    await form.press(keys.delete);
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> _Xbc'));

    await form.press(keys.right);
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> X_bc'));

    await form.press(keys.end);
    await form.press(keys.backspace);
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> Xb_'));
  });

  it('moves over and deletes a character of several code points as one character', async () => {
    const form = await renderForm({
      formDef: nameForm,
      data: { name: `a${WOMAN_TECHNOLOGIST}b` },
    });
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe(`> a${WOMAN_TECHNOLOGIST}b_`));

    await form.press(keys.left);
    await form.press(keys.left);
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe(`> a_${WOMAN_TECHNOLOGIST}b`));

    await form.press(keys.delete);
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> a_b'));

    await form.press(keys.end);
    await form.press(WOMAN_TECHNOLOGIST);
    await form.press(keys.backspace);
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> ab_'));
  });

  it('stores a pasted text without its line breaks', async () => {
    const form = await renderForm({
      formDef: {
        form: [
          { uid: 'email', kind: 'input', type: 'textinput', path: 'email', label: 'Email' },
          { uid: 'city', kind: 'input', type: 'textinput', path: 'city', label: 'City' },
        ],
      },
      data: { email: '', city: '' },
    });
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> _'));

    // A password manager or a copied line often ends with a line break.
    await form.press(bracketedPaste('joan@example.com\r\n'));
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> joan@example.com_'));

    // An unfocused field shows the store value, so the frame after Tab shows what was stored.
    await form.press(keys.tab);
    await vi.waitFor(() => {
      expect(focusedLine(form.frame())).toBe('> _');
      expect(form.frame()).toContain('Email\n  joan@example.com\n');
    });
  });

  it('inserts a paste that arrives without the bracketed paste markers', async () => {
    const form = await renderForm({ formDef: nameForm, data: { name: '' } });
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> _'));

    await form.press('Joan\n');

    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> Joan_'));
  });

  it('skips a disabled field when tabbing', async () => {
    const form = await renderForm({
      formDef: {
        form: [
          { uid: 'first', kind: 'input', type: 'textinput', path: 'first', label: 'First' },
          {
            uid: 'second',
            kind: 'input',
            type: 'textinput',
            path: 'second',
            label: 'Second',
            disabled: true,
          },
          { uid: 'third', kind: 'input', type: 'textinput', path: 'third', label: 'Third' },
        ],
      },
    });

    await form.press(keys.tab);
    await vi.waitFor(() => expect(form.frame()).toContain('Third\n> '));

    await form.press('x');
    await vi.waitFor(() => expect(form.frame()).toContain('Third\n> x_'));
    expect(form.frame()).not.toContain('Second\n> ');
  });
});
