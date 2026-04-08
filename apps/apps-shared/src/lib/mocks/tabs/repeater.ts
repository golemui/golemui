export const repeater = (uid: string): any => ({
  uid,
  kind: 'layout',
  type: 'flex',
  children: [
    {
      uid: '',
      kind: 'input',
      type: 'repeater',
      path: 'repeaters.users',
      label: 'Team Members',
      props: {
        title: 'Developer',
        addButtonIcon: 'person_add',
        removeButtonIcon: 'delete',
        addLabel: 'Add new developer',
        'addLabel.limitReached': `'Limit Reached, you can't add more'`,
        removeLabel: 'Delete',
        limit: 5,
        template: {
          uid: '',
          kind: 'layout',
          type: 'grid',
          children: [
            {
              uid: '',
              kind: 'input',
              type: 'textinput',
              path: 'repeaters.users.items.firstName',
              validator: { type: 'string', required: true },
            },
            {
              uid: '',
              kind: 'input',
              type: 'textinput',
              path: 'repeaters.users.items.lastName',
            },
          ],
        },
      },
      validator: {
        type: 'array',
        required: true,
        minItems: 1,
        maxItems: 2,
      },
    },
  ],
});
