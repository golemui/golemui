import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.repeater('users', {
    addLabel: 'Add new developer',
    removeLabel: 'Remove developer',
    defaultValue: [
      {
        firstName: 'John',
        lastName: 'Doe',
      },
      {
        firstName: 'Jane',
        lastName: 'Doe',
      },
    ],
    template: [
      gui.layouts.flex([
        gui.inputs.textInput('users.items.firstName'),
        gui.inputs.textInput('users.items.lastName'),
      ]),
    ],
  }),
];
