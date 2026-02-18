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
        addLabel: 'Add new developer',
        'addLabel.limitReached': "Limit Reached, you can't add more",
        removeLabel: 'Remove developer',
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
