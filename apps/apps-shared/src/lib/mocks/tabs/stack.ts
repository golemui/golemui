export const stack = (): any => ({
  uid: 'tab2',
  kind: 'layout',
  widget: 'stack',
  props: {
    direction: 'horizontal',
    'direction.limitReached': 'vertical',
  },
  children: [
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: 'listName',
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: 'listOwner',
    },
  ],
});
