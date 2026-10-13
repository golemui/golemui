import { cleanup } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderForm } from '../spec-helpers/render-form';

describe('the flex layout widget', () => {
  afterEach(() => {
    cleanup();
  });

  it('stacks its children on separate lines in the default column direction', async () => {
    const form = await renderForm({
      formDef: {
        form: [
          {
            uid: 'stack',
            kind: 'layout',
            type: 'flex',
            children: [
              { uid: 'one', kind: 'display', type: 'markdownText', props: { md: 'one' } },
              { uid: 'two', kind: 'display', type: 'markdownText', props: { md: 'two' } },
            ],
          },
        ],
      },
    });

    await vi.waitFor(() => expect(form.frame()).toContain('one\ntwo'));
  });

  it('puts its children on one line in the row direction', async () => {
    const form = await renderForm({
      formDef: {
        form: [
          {
            uid: 'row',
            kind: 'layout',
            type: 'flex',
            props: { direction: 'row' },
            children: [
              { uid: 'one', kind: 'display', type: 'markdownText', props: { md: 'one' } },
              { uid: 'two', kind: 'display', type: 'markdownText', props: { md: 'two' } },
            ],
          },
        ],
      },
    });

    await vi.waitFor(() => {
      const [firstLine] = form.frame().split('\n');
      expect(firstLine).toContain('one');
      expect(firstLine).toContain('two');
    });
  });
});
