import { describe, expect, it } from 'vitest';
import { renderFormWithoutTerminal } from './spec-helpers/render-form';

const formDef = {
  form: [
    {
      uid: 'login-email',
      kind: 'input',
      type: 'textinput',
      path: 'login.email',
      label: 'Email',
    },
    {
      uid: 'login-subscribe',
      kind: 'input',
      type: 'checkbox',
      path: 'login.subscribe',
      label: 'Subscribe to the newsletter',
    },
    { uid: 'login-submit', kind: 'action', type: 'button', actionType: 'submit', label: 'Sign up' },
  ],
};

describe('GuiForm on a host without a terminal', () => {
  it('renders the form once, with a notice and no focused field', async () => {
    const form = await renderFormWithoutTerminal({ formDef, data: { login: { email: 'a@b.c' } } });

    try {
      const frame = form.frame();
      expect(frame).toContain('Email');
      expect(frame).toContain('a@b.c');
      expect(frame).toContain('Subscribe to the newsletter');
      expect(frame).toContain('Keyboard input needs a terminal. The form is shown read-only.');
      // The focus marker and the caret of a focused text field never appear.
      expect(frame).not.toContain('> ');
      expect(frame).not.toContain('a@b.c_');
      // Ink throws from `useInput` when a widget asks for raw mode it cannot have.
      expect(form.stdin.wasRawModeRequested).toBe(false);
    } finally {
      form.unmount();
    }
  });
});
