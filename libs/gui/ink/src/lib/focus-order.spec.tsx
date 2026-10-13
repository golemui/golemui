import { cleanup } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { focusedLine, keys, renderForm } from './spec-helpers/render-form';

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
});
