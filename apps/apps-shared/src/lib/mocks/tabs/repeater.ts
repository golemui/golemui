export const repeater = (): any => ({
  uid: 'tab3',
  kind: 'layout',
  type: 'flex',
  children: [
    {
      uid: '',
      kind: 'input',
      type: 'repeater',
      path: 'repeaters.users',
      props: {
        title: 'Developer',
        addButtonIcon: 'material-icons material-icons-person_add',
        removeButtonIcon: 'material-icons material-icons-delete',
        addLabel: 'Add new developer',
        'addLabel.limitReached': `'Limit Reached, you can't add more'`,
        removeLabel: 'Delete',
        limit: 5,
        template: {
          uid: '',
          kind: 'layout',
          type: 'flex',
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
