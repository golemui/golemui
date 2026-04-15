import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'repeater_limit',
      kind: 'input',
      type: 'repeater',
      path: 'contacts',
      label: 'Emergency Contacts',
      props: {
        limit: 3,
        addLabel: 'Add Contact',
        removeLabel: 'Delete',
        template: {
          kind: 'layout',
          type: 'flex',
          children: [
            {
              kind: 'input',
              type: 'textinput',
              path: 'contacts.items.phone',
              label: 'Phone Number',
            },
          ],
        },
      },
    },
  ],
});
