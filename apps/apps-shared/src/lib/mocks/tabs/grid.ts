export const grid = (uid: string): any => ({
  uid,
  kind: 'layout',
  type: 'grid',
  props: {
    direction: 'column',
  },
  children: [
    {
      kind: 'layout',
      type: 'grid',
      props: {
        direction: 'row',
      },
      children: [
        {
          uid: '',
          kind: 'input',
          type: 'textinput',
          path: 'listName',
          label: 'List Name',
          props: {
            hint: 'This is a hint',
          },
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
      ]
    },
    {
      kind: 'layout',
      type: 'grid',
      props: {
        direction: 'row',
      },
      children: [
        {
          uid: '',
          kind: 'input',
          type: 'textinput',
          path: 'listName2',
          label: 'List Name',
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
        {
          uid: '',
          kind: 'input',
          type: 'toggle',
          label: 'Toggle',
          path: 'tg1',
          props: {
            togglePosition: 'left',
            hint: 'Long hints are discouraged with checkboxes and toggles when these share a row with a text input',
          },
          validator: { type: 'boolean', required: true },
        },
        {
          uid: '',
          kind: 'input',
          type: 'checkbox',
          label: 'Checkbox',
          path: 'cb1',
          props: {
            checkboxPosition: 'left',
            hint: 'Long hints are discouraged with checkboxes and toggles when these share a row with a text input',
          },
          validator: { type: 'boolean', required: true },
        },
      ]
    },
  ],
});
