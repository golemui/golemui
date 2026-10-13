import type { FormSubmitEvent } from '@golemui/core';
import { cleanup } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { keys, renderForm } from '../spec-helpers/render-form';

describe('the button widget', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the label between brackets', async () => {
    const form = await renderForm({
      formDef: {
        form: [{ uid: 'save', kind: 'action', type: 'button', label: 'Save' }],
      },
    });

    await vi.waitFor(() => expect(form.frame()).toContain('[ Save ]'));
  });

  it('submits the form when a submit button is activated with enter', async () => {
    const submitted: FormSubmitEvent[] = [];
    const form = await renderForm(
      {
        formDef: {
          form: [
            { uid: 'email', kind: 'input', type: 'textinput', path: 'email', label: 'Email' },
            {
              uid: 'save',
              kind: 'action',
              type: 'button',
              actionType: 'submit',
              label: 'Save',
            },
          ],
        },
        data: { email: 'joan@example.com' },
      },
      (event) => submitted.push(event),
    );

    await form.press(keys.tab);
    await vi.waitFor(() => expect(form.frame()).toContain('> [ Save ]'));

    await form.press(keys.enter);

    await vi.waitFor(() => expect(submitted).toHaveLength(1));
    expect(submitted[0].data).toEqual({ email: 'joan@example.com' });
  });
});
