export const repeater = (): any => ({
  uid: 'tab3',
  kind: 'layout',
  widget: 'stack',
  children: [
    {
      uid: '',
      kind: 'control',
      widget: 'repeater',
      path: 'repeaters.users',
      props: {
        addLabel: 'Add new developer',
        'addLabel.limitReached': "Limit Reached, you can't add more",
        removeLabel: 'Remove developer',
        limit: 5,
        template: {
          uid: '',
          kind: 'layout',
          widget: 'stack',
          children: [
            {
              uid: '',
              kind: 'control',
              widget: 'textinput',
              path: 'repeaters.users.items.firstName',
            },
            {
              uid: '',
              kind: 'control',
              widget: 'textinput',
              path: 'repeaters.users.items.lastName',
            },
          ],
        },
      },
    },
  ],
});
