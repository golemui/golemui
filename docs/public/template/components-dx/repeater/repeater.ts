import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'repeater_basic',
      kind: 'input',
      type: 'repeater',
      path: 'guests',
      label: 'Guest List',
      props: {
        addLabel: 'Add Guest',
        removeLabel: 'Remove Guest',
        template: {
          kind: 'layout',
          type: 'flex',
          children: [
            {
              kind: 'input',
              type: 'textinput',
              path: 'guests.items.guest_name',
              label: 'Full Name',
            },
          ],
        },
      },
    },
  ],
});
