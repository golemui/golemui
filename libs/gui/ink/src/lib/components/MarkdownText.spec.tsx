import { cleanup } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderForm } from '../spec-helpers/render-form';

describe('the markdownText widget', () => {
  afterEach(() => {
    cleanup();
  });

  it('prints the markdown source as plain text', async () => {
    const form = await renderForm({
      formDef: {
        form: [
          {
            uid: 'intro',
            kind: 'display',
            type: 'markdownText',
            props: { md: 'Sign up for the newsletter' },
          },
        ],
      },
    });

    await vi.waitFor(() => expect(form.frame()).toContain('Sign up for the newsletter'));
  });
});
