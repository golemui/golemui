import { cleanup } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { focusedLine, keys, renderForm } from '../spec-helpers/render-form';

describe('the checkbox widget', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the label next to the unchecked glyph', async () => {
    const form = await renderForm({
      formDef: {
        form: [
          {
            uid: 'subscribe',
            kind: 'input',
            type: 'checkbox',
            path: 'subscribe',
            label: 'Subscribe to the newsletter',
          },
        ],
      },
    });

    await vi.waitFor(() => expect(form.frame()).toContain('[ ] Subscribe to the newsletter'));
  });

  it('toggles the value when space is pressed', async () => {
    const form = await renderForm({
      formDef: {
        form: [
          {
            uid: 'subscribe',
            kind: 'input',
            type: 'checkbox',
            path: 'subscribe',
            label: 'Subscribe',
          },
        ],
      },
    });

    await form.press(keys.space);

    await vi.waitFor(() => expect(form.frame()).toContain('[x] Subscribe'));
  });

  it('moves to the next field without toggling when enter is pressed', async () => {
    const form = await renderForm({
      formDef: {
        form: [
          {
            uid: 'subscribe',
            kind: 'input',
            type: 'checkbox',
            path: 'subscribe',
            label: 'Subscribe',
          },
          { uid: 'email', kind: 'input', type: 'textinput', path: 'email', label: 'Email' },
        ],
      },
      data: { email: '' },
    });
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> [ ] Subscribe'));

    await form.press(keys.enter);

    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> _'));
    expect(form.frame()).toContain('[ ] Subscribe');
  });
});
