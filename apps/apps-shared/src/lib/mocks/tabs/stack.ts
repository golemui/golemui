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
      size: 1,
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: 'listOwner',
      size: 2,
    },
  ],
});
