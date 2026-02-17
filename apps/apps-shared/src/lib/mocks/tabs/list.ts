const thousandsOfItems = Array.from({ length: 1000 }, (_, i) => i);

export const list = (): any => ({
  uid: 'tab14',
  kind: 'layout',
  type: 'flex',
  children: [
    {
      uid: '',
      kind: 'input',
      type: 'list',
      path: 'lists.defaultListRenderer',
      props: {
        height: 100,
        hint: 'Virtual scroll list with 1000 items. Default Item height.',
        items: thousandsOfItems,
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'list',
      path: 'lists.defaultRenderer20',
      label: 'Default Renderer with 20px item height',
      props: {
        height: 100,
        itemHeight: 20,
        hint: 'Virtual scroll list with 1000 items. Item height is 20px.',
        items: thousandsOfItems,
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'list',
      path: 'lists.disabledList',
      label: 'Disabled list',
      disabled: true,
      readonly: true,
      props: {
        height: 100,
        items: thousandsOfItems,
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'list',
      path: 'lists.requiredList',
      label: 'Required list',
      props: {
        hint: 'Select a number greater than 10.',
        height: 100,
        items: thousandsOfItems,
      },
      validator: { type: 'number', required: true, minimum: 10 },
    },
    {
      uid: '',
      kind: 'input',
      type: 'list',
      path: 'lists.invalidValueList',
      label: 'Invalid value list',
      props: {
        hint: 'A list containing invalid values.',
        height: 100,
        items: thousandsOfItems,
      },
      validator: { type: 'string', required: true },
    },
    {
      uid: '',
      kind: 'input',
      type: 'list',
      path: 'lists.customItemRenderer',
      props: {
        height: 150,
        itemHeight: 60,
        valueField: 'value',
        itemRenderer: 'complexListItemRenderer',
        items: [
          { value: 'one', title: 'This is One', description: 'Blah blah blah Lorem Ipsum' },
          { value: 'two', title: 'Two this is', description: 'Ok, blah blah Ipsum Lorem' },
          { value: 'three', title: 'Three this is', description: 'Lorem Ipsum blah blah blah' },
          { value: 'four', title: 'Four this is', description: 'bluh bluh bluh' },
          { value: 'five', title: 'Five this is', description: 'bleh bleh' },
          { value: 'six', title: 'Six this is', description: 'blih blih blih' },
        ],
      },
    },
  ],
});
