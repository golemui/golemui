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
      uid: 'col1',
      kind: 'layout',
      type: 'flex',
      size: 2,
      props: {
        direction: 'column',
      },
      children: [
        {
          uid: '',
          kind: 'input',
          type: 'textinput',
          path: 'listName1',
          label: 'List Name',
          size: 1,
          validator: { type: 'string', required: true },
        },
        {
          uid: '',
          kind: 'input',
          type: 'textinput',
          path: 'listOwner1',
          label: 'List Owner',
          size: 2,
          validator: { type: 'string', required: true },
        },
      ],
    },
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'listName2',
      label: 'List Name',
      size: 1,
      validator: { type: 'string', required: true },
    },
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'listOwner2',
      label: 'List Owner',
      size: 2,
      validator: { type: 'string', required: true },
    },
  ],
});
