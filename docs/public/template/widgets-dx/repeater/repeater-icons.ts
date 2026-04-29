import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.repeater('guests', {
    addLabel: 'Add Guest',
    removeLabel: 'Remove',
    addButtonIcon: 'add',
    removeButtonIcon: 'remove',
    label: 'Guest List',
    uid: 'repeater_icons',
    template: [
      gui.layouts.flex([
        gui.inputs.textInput('guests.items.guest_name', {
          label: 'Full Name',
        }),
      ]),
    ],
  }),
];
