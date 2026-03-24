export const flex = (uid: string): any => ({
  uid,
  kind: 'layout',
  type: 'flex',
  props: {
    direction: 'row',
    'direction.limitReached': 'column',
  },
  children: [
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'listName',
      label: 'List Name',
      size: 1,
      validator: { type: 'string', required: true },
    },
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'listOwner',
      label: 'List Owner',
      size: 2,
      validator: { type: 'string', required: true },
    },
  ],
});
