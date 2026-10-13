import { cleanup, render } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GuiForm } from './components/Form';
import { keys } from './spec-helpers/render-form';
import { stripAnsi } from './spec-helpers/strip-ansi';
import { type ThemeOverrides } from './theme';

const formDef = {
  form: [
    {
      uid: 'subscribe',
      kind: 'input',
      type: 'checkbox',
      path: 'subscribe',
      label: 'Subscribe',
      validator: { type: 'boolean', required: true },
    },
  ],
};

function renderWithTheme(theme: ThemeOverrides) {
  const instance = render(<GuiForm config={{ formDef }} theme={theme} />);
  return { ...instance, frame: () => stripAnsi(instance.lastFrame()) };
}

describe('the theme of a form', () => {
  afterEach(() => {
    cleanup();
  });

  it('draws the glyphs the host replaces and keeps the defaults of the others', async () => {
    const form = renderWithTheme({ glyphs: { checkboxOff: '[_]', checkboxOn: '[v]' } });

    // The focus marker and the required glyph keep their defaults.
    await vi.waitFor(() => expect(form.frame()).toContain('> [_] Subscribe*'));

    form.stdin.write(keys.space);

    await vi.waitFor(() => expect(form.frame()).toContain('> [v] Subscribe*'));
  });

  it('keeps the default of a glyph the host sets to undefined', async () => {
    const form = renderWithTheme({ glyphs: { checkboxOff: undefined, focusMarker: '=>' } });

    await vi.waitFor(() => expect(form.frame()).toContain('=> [ ] Subscribe*'));
  });
});
