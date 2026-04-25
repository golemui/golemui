import { gui } from '@golemui/gui-shared';

export const flexTab = gui.layouts.flex(
  [
    gui.layouts.flex(
      [
        gui.inputs.textInput('listName1', {
          label: 'List Name',
          size: 1,
          validator: { required: true },
        }),
        gui.inputs.textInput('listOwner1', {
          label: 'List Owner',
          size: 2,
          validator: { required: true },
        }),
      ],
      { direction: 'column', size: 2, uid: 'col1' },
    ),
    gui.inputs.textInput('listName2', {
      label: 'List Name',
      size: 1,
      validator: { required: true },
    }),
    gui.inputs.textInput('listOwner2', {
      label: 'List Owner',
      size: 2,
      validator: { required: true },
    }),
  ],
  {
    direction: 'row',
    // JSON KS uses the `'direction.limitReached': 'column'` shorthand that
    // expands to a per-widget state override. Spec form is the per-widget
    // `states:` block.
    states: { limitReached: { direction: 'column' } },
  },
);
