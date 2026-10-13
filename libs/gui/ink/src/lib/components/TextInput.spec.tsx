import { cleanup } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { keys, renderForm } from '../spec-helpers/render-form';

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
