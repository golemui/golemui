import type { FormSubmitEvent } from '@golemui/core';
import { cleanup } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { keys, renderForm } from './spec-helpers/render-form';

// The apps-shared mocks cannot be imported here, the module boundaries forbid a lib depending on
// an app. This is the shape of apps/apps-shared/src/lib/mocks/tiny.form.json, with the custom
// heading widget replaced by markdownText.
const formDef = {
  form: [
    {
      uid: 'login-grid',
      kind: 'layout',
      type: 'grid',
      props: { direction: 'column' },
      children: [
        {
          uid: 'login-title',
          kind: 'display',
          type: 'markdownText',
          props: { md: 'Sign up' },
        },
        {
          uid: 'login-email',
          kind: 'input',
          type: 'textinput',
          path: 'login.email',
          label: 'Email',
          props: { placeholder: 'example@domain.com' },
        },
        {
          uid: 'login-password',
          kind: 'input',
          type: 'password',
          path: 'login.password',
          label: 'Password',
          props: { placeholder: 'Enter your password...' },
        },
        {
          uid: 'login-subscribe',
          kind: 'input',
          type: 'checkbox',
          path: 'login.subscribe',
          label: 'Subscribe to the newsletter',
        },
        {
          uid: 'login-submit',
          kind: 'action',
          type: 'button',
          actionType: 'submit',
          label: 'Sign up',
        },
      ],
    },
  ],
};

describe('GuiForm in a terminal', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the labels and the placeholder of the unfocused password', async () => {
    const form = await renderForm({ formDef });

    await vi.waitFor(() => {
      const frame = form.frame();
      expect(frame).toContain('Sign up');
      expect(frame).toContain('Email');
      expect(frame).toContain('Password');
      expect(frame).toContain('Subscribe to the newsletter');
      expect(frame).toContain('Enter your password...');
    });
  });

  it('fills every field with the keyboard and submits the collected data', async () => {
    const submitted: FormSubmitEvent[] = [];
    const form = await renderForm({ formDef }, (event) => submitted.push(event));

    await form.press('joan@example.com');
    await vi.waitFor(() => expect(form.frame()).toContain('joan@example.com'));

    // No wait between the Tab and the first character of the next field. The form hands each key
    // to the widget that is focused when the key arrives, so the key reaches the field the frame
    // already shows.
    await form.press(keys.tab);
    await form.press('secret');
    await vi.waitFor(() => expect(form.frame()).toContain('******'));

    await form.press(keys.tab);
    await vi.waitFor(() => expect(form.frame()).toContain('> [ ] Subscribe'));

    await form.press(keys.space);
    await vi.waitFor(() => expect(form.frame()).toContain('[x]'));

    await form.press(keys.tab);
    await vi.waitFor(() => expect(form.frame()).toContain('> [ Sign up ]'));

    await form.press(keys.enter);

    await vi.waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0].data).toEqual({
      login: { email: 'joan@example.com', password: 'secret', subscribe: true },
    });
  });

  it('reports a widget type the set does not implement through the form health', async () => {
    // The adapter logs the errored form health, which is expected noise here.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const form = await renderForm({
        formDef: {
          form: [
            { uid: 'name', kind: 'input', type: 'textinput', path: 'name', label: 'Name' },
            {
              uid: 'people',
              kind: 'input',
              type: 'repeater',
              path: 'people',
              props: {
                template: {
                  kind: 'layout',
                  type: 'grid',
                  children: [
                    { kind: 'input', type: 'textinput', path: 'firstName', label: 'First name' },
                  ],
                },
              },
            },
          ],
        },
      });

      await vi.waitFor(() => {
        const frame = form.frame();
        expect(frame).toContain('GolemUI form error');
        expect(frame).toContain('Widget "repeater" could not be loaded');
        // The rest of the form stays on screen below the error.
        expect(frame).toContain('Name');
      });
    } finally {
      consoleError.mockRestore();
    }
  });
});
