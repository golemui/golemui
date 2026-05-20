import { gui } from '@golemui/gui-shared';

// Suppression demo — labels and placeholders are suppressed globally,
// then re-enabled for 'identity'-tagged inputs.
export const sensibleDefaultsDemo = {
  data: {},
  form: [
    gui.layouts.flex(
      [
        gui.inputs.textInput('username', undefined, ['identity']),
        gui.inputs.textInput('firstName'),
        gui.inputs.textInput('lastName'),
      ],
      { direction: 'column', gap: 12 },
    ),
  ],
  selectors: [
    // Suppress auto-labels and auto-placeholders on every input.
    gui.selectors.inputs({
      suppressAutomaticLabels: true,
      suppressAutomaticPlaceholders: true,
    }),
    // Re-enable auto-placeholders for inputs tagged 'identity'.
    gui.selectors.tag('identity').inputs({
      suppressAutomaticPlaceholders: false,
    }),
  ],
  resources: {},
};
