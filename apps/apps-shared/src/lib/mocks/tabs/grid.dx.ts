import { gui } from '@golemui/gui-shared';

export const gridTab = gui.layouts.grid(
  [
    gui.layouts.grid(
      [
        gui.inputs.textInput('listName', {
          label: 'List Name',
          size: 4,
          hint: 'This is a hint',
          validator: { required: true },
        }),
        gui.inputs.textInput('listOwner', {
          label: 'List Owner',
          size: 4,
          validator: { required: true },
        }),
      ],
      { direction: 'row' },
    ),
    gui.layouts.grid(
      [
        gui.inputs.textInput('listName3', {
          label: 'List Name',
          size: 3,
          validator: { required: true },
        }),
        gui.inputs.textInput('listOwner3', {
          label: 'List Owner',
          size: 3,
          validator: { required: true },
        }),
        gui.inputs.booleanInput('tg1', {
          label: 'Toggle',
          size: 3,
          togglePosition: 'left',
          hint: 'Long hints are discouraged with checkboxes and toggles when these share a row with a text input',
          validator: { required: true },
        }),
        gui.inputs.checkbox('cb1', {
          label: 'Checkbox',
          size: 3,
          checkboxPosition: 'left',
          hint: 'Long hints are discouraged with checkboxes and toggles when these share a row with a text input',
          validator: { required: true },
        }),
      ],
      { direction: 'row' },
    ),
  ],
  { direction: 'column' },
);
