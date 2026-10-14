import { cleanup } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderForm } from '../spec-helpers/render-form';

function text(uid: string, size?: number) {
  return { uid, kind: 'display', type: 'markdownText', size, props: { md: uid } };
}

function renderGrid(props: Record<string, unknown> | undefined, children: object[]) {
  return renderForm({
    formDef: {
      form: [{ uid: 'grid', kind: 'layout', type: 'grid', props, children }],
    },
  });
}

describe('the grid layout widget', () => {
  afterEach(() => {
    cleanup();
  });

  it('stacks its children on separate lines by default', async () => {
    const form = await renderGrid(undefined, [text('one'), text('two')]);

    await vi.waitFor(() => expect(form.frame()).toContain('one\ntwo'));
  });

  it('puts its children on one line in the row direction', async () => {
    const form = await renderGrid({ direction: 'row' }, [text('one'), text('two')]);

    await vi.waitFor(() => {
      const [firstLine] = form.frame().split('\n');
      expect(firstLine).toContain('one');
      expect(firstLine).toContain('two');
    });
  });

  it('places a row of children at the end of the line with justify end', async () => {
    const form = await renderGrid({ direction: 'row', justify: 'end' }, [text('one'), text('two')]);

    await vi.waitFor(() => {
      const [firstLine] = form.frame().split('\n');
      expect(firstLine).toMatch(/^ {10,}one {2}two$/);
    });
  });

  it('fills rows of the given number of columns, each child spanning its size', async () => {
    const form = await renderGrid({ columns: 2 }, [
      text('wide', 2),
      text('left'),
      text('right'),
      text('last'),
    ]);

    await vi.waitFor(() => {
      const lines = form.frame().split('\n');
      expect(lines[0].trim()).toBe('wide');
      expect(lines[1]).toMatch(/^left +right$/);
      expect(lines[2].trim()).toBe('last');
    });
  });

  it('keeps the cells of a short last row at the width of the rows above', async () => {
    const form = await renderGrid({ columns: 3 }, [
      text('one'),
      text('two'),
      text('three'),
      text('four'),
      text('five'),
    ]);

    await vi.waitFor(() => {
      const [firstLine, secondLine] = form.frame().split('\n');
      expect(secondLine.indexOf('five')).toBe(firstLine.indexOf('two'));
    });
  });

  it('wraps its children in as many columns as fit with columns auto', async () => {
    const form = await renderGrid({ columns: 'auto' }, [
      text('one'),
      text('two'),
      text('three'),
      text('four'),
      text('five'),
    ]);

    // 100 cells hold three cells of at least 24 cells each, plus their gaps.
    await vi.waitFor(() => {
      const [firstLine, secondLine] = form.frame().split('\n');
      expect(firstLine).toMatch(/^one +two +three$/);
      expect(secondLine).toMatch(/^four +five$/);
    });
  });

  it('does not render the deprecated flex layout and names it in the form health', async () => {
    // The adapter logs the errored form health, which is expected noise here.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const form = await renderForm({
        formDef: {
          form: [
            { uid: 'name', kind: 'input', type: 'textinput', path: 'name', label: 'Name' },
            { uid: 'old-layout', kind: 'layout', type: 'flex', children: [text('inside')] },
          ],
        },
      });

      await vi.waitFor(() => {
        expect(form.frame()).toContain('Widget "flex" could not be loaded');
        expect(form.frame()).not.toContain('inside');
      });
    } finally {
      consoleError.mockRestore();
    }
  });
});
