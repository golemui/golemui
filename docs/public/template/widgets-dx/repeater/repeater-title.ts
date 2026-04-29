import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.repeater('guests', {
    title: 'Guest',
    addLabel: 'Add Guest',
    removeLabel: 'Remove',
    label: 'Guest List',
    uid: 'repeater_title',
    template: [
      gui.layouts.flex([
        gui.inputs.textInput('guests.items.guest_name', {
          label: 'Full Name',
        }),
      ]),
    ],
  }),
];
