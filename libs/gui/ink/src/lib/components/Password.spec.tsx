import { cleanup } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { focusedLine, renderForm } from '../spec-helpers/render-form';

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

  it('draws one mask character for a character of several code points', async () => {
    const womanTechnologist = String.fromCodePoint(0x1f469, 0x200d, 0x1f4bb);
    const form = await renderForm({
      formDef: {
        form: [
          { uid: 'secret', kind: 'input', type: 'password', path: 'secret', label: 'Password' },
        ],
      },
      data: { secret: `a${womanTechnologist}b` },
    });

    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> ***_'));
  });
});
