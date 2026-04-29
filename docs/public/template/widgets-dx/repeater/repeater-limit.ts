import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.repeater('contacts', {
    limit: 3,
    addLabel: 'Add Contact',
    removeLabel: 'Delete',
    label: 'Emergency Contacts',
    uid: 'repeater_limit',
    template: [
      gui.layouts.flex([
        gui.inputs.textInput('contacts.items.phone', {
          label: 'Phone Number',
        }),
      ]),
    ],
  }),
];
