import { gui } from '@golemui/gui-shared';

export const ratingTab = gui.layouts.grid([
  gui.inputs.rating('ratings.service', {
    label: 'Service',
    hint: 'Click the picked star again, or press Delete, to clear it',
  }),
  gui.inputs.rating('ratings.food', {
    label: 'Food',
    hint: 'Required: an error shows once it is touched, and again once it is cleared',
    validator: {
      required: true,
      messages: { invalid: 'Rate the food' },
    },
  }),
  gui.inputs.rating('ratings.stay', {
    label: 'Your stay',
    hint: "Ten stars: the validator's maximum",
    validator: { maximum: 10 },
    defaultValue: 7,
  }),
  gui.inputs.rating('ratings.disabled', { label: 'Disabled', disabled: true, defaultValue: 2 }),
  gui.inputs.rating('ratings.readonly', { label: 'Read-only', readonly: true, defaultValue: 4 }),
  // A rating lines up with the fields beside it.
  gui.layouts.horizontalGrid([
    gui.inputs.textInput('ratings.reviewer', { label: 'Reviewer' }),
    gui.inputs.rating('ratings.overall', { label: 'Overall' }),
  ]),
]);
