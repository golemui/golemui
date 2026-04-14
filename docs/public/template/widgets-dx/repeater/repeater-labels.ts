import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'repeater',
      path: 'users',
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
      props: {
        addLabel: 'Add new developer',
        removeLabel: 'Remove developer',
        template: {
          kind: 'layout',
          type: 'flex',
          children: [
            {
              kind: 'input',
              type: 'textinput',
              path: 'users.items.firstName',
            },
            {
              kind: 'input',
              type: 'textinput',
              path: 'users.items.lastName',
            },
          ],
        },
      },
    },
  ],
});
