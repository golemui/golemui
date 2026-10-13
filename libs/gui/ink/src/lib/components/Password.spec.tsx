import { cleanup } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderForm } from '../spec-helpers/render-form';

describe('the password widget', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the label and masks the stored value', async () => {
    const form = await renderForm({
      formDef: {
        form: [
          {
            uid: 'secret',
            kind: 'input',
            type: 'password',
            path: 'secret',
            label: 'Password',
          },
        ],
      },
      data: { secret: 'hunter2' },
    });

    await vi.waitFor(() => {
      expect(form.frame()).toContain('Password');
      expect(form.frame()).toContain('*******');
    });
    expect(form.frame()).not.toContain('hunter2');
  });
});
