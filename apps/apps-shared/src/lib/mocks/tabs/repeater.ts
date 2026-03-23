export const repeater = (): any => ({
  uid: 'tab3',
  kind: 'layout',
  type: 'grid',
  children: [
    {
      uid: '',
      kind: 'input',
      type: 'repeater',
      path: 'repeaters.users',
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
    },
  ],
});
