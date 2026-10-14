import { cleanup } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { focusedLine, keys, renderForm } from './spec-helpers/render-form';

const TAB_CODE_POINT = 9;
const LETTER_X_CODE_POINT = 120;

/** The sequence the kitty keyboard protocol sends when a key is released. */
function kittyRelease(codePoint: number): string {
  return `${String.fromCharCode(27)}[${codePoint};1:3u`;
}

const formDef = {
  form: [
    {
      uid: 'show-middle',
      kind: 'input',
      type: 'checkbox',
      path: 'showMiddle',
      label: 'Show middle',
    },
    {
      uid: 'middle',
      kind: 'input',
      type: 'textinput',
      path: 'middle',
      label: 'Middle',
      include: { when: '$form.showMiddle === true' },
    },
    { uid: 'last', kind: 'input', type: 'textinput', path: 'last', label: 'Last' },
  ],
};

describe('the tab order of a form', () => {
  afterEach(() => {
    cleanup();
  });

  it('skips a widget that is not included', async () => {
    const form = await renderForm({ formDef, data: { middle: 'M', last: 'L' } });

    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> [ ] Show middle'));

    await form.press(keys.tab);

    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> L_'));
  });

  it('gives a widget included at runtime the place where it is drawn', async () => {
    const form = await renderForm({ formDef, data: { middle: 'M', last: 'L' } });

    await form.press(keys.space);
    await vi.waitFor(() => expect(form.frame()).toContain('Middle'));

    await form.press(keys.tab);
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> M_'));

    await form.press(keys.tab);
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> L_'));

    // The wrap at the end reaches the first widget of the form, not the widget that mounted last.
    await form.press(keys.tab);
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> [x] Show middle'));
  });

  it('walks backwards through the same order', async () => {
    const form = await renderForm({ formDef, data: { middle: 'M', last: 'L' } });

    await form.press(keys.space);
    await vi.waitFor(() => expect(form.frame()).toContain('Middle'));

    await form.press(keys.shiftTab);
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> L_'));

    await form.press(keys.shiftTab);
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> M_'));
  });

  it('gives a key that moves the focus to the focused widget only', async () => {
    const form = await renderForm({
      formDef: {
        form: [
          { uid: 'first', kind: 'input', type: 'textinput', path: 'first', label: 'First' },
          { uid: 'second', kind: 'input', type: 'textinput', path: 'second', label: 'Second' },
          { uid: 'agree', kind: 'input', type: 'checkbox', path: 'agree', label: 'Agree' },
        ],
      },
      data: { first: 'A', second: 'B' },
    });

    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> A_'));

    // Enter moves on from a text field. The field it focuses must not handle the same Enter.
    await form.press(keys.enter);
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> B_'));

    await form.press(keys.enter);
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> [ ] Agree'));
  });

  it('keeps the focus on a widget that remounts in another grid row', async () => {
    // In a grid of two columns, typing into Name includes Extra before it, which pushes Name
    // into the next row. A new row is a new parent, so Name unmounts and mounts again.
    const form = await renderForm({
      formDef: {
        form: [
          {
            uid: 'two-columns',
            kind: 'layout',
            type: 'grid',
            props: { columns: 2 },
            children: [
              { uid: 'first', kind: 'input', type: 'textinput', path: 'first', label: 'First' },
              {
                uid: 'extra',
                kind: 'input',
                type: 'textinput',
                path: 'extra',
                label: 'Extra',
                include: { when: "$form.name === 'x'" },
              },
              { uid: 'name', kind: 'input', type: 'textinput', path: 'name', label: 'Name' },
            ],
          },
        ],
      },
      data: { first: 'F', name: '' },
    });
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> F_'));

    // Both cells of a row are drawn on one line.
    await form.press(keys.tab);
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('F > _'));

    await form.press('x');
    await vi.waitFor(() => {
      expect(form.frame()).toContain('Extra');
      expect(focusedLine(form.frame())).toBe('> x_');
    });

    // The next key removes Extra again, and Name moves back to the first row.
    await form.press('y');
    await vi.waitFor(() => {
      expect(form.frame()).not.toContain('Extra');
      expect(focusedLine(form.frame())).toBe('F > xy_');
    });
  });

  it('ignores the release of a key that the kitty keyboard protocol reports', async () => {
    const form = await renderForm({
      formDef: {
        form: [
          { uid: 'first', kind: 'input', type: 'textinput', path: 'first', label: 'First' },
          { uid: 'second', kind: 'input', type: 'textinput', path: 'second', label: 'Second' },
          { uid: 'agree', kind: 'input', type: 'checkbox', path: 'agree', label: 'Agree' },
        ],
      },
      data: { first: 'A', second: 'B' },
    });
    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> A_'));

    await form.press(keys.tab);
    await form.press(kittyRelease(TAB_CODE_POINT));
    await form.press('x');
    await form.press(kittyRelease(LETTER_X_CODE_POINT));

    await vi.waitFor(() => expect(focusedLine(form.frame())).toBe('> Bx_'));
  });
});
