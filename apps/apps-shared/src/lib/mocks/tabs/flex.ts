export const flex = (): any => ({
  uid: 'tab2',
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
    },
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'listOwner',
      size: 2,
    },
  ],
});
