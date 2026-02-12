export const number = (): any => ({
  uid: 'tab8',
  kind: 'layout',
  type: 'stack',
  children: [
    {
      uid: '',
      kind: 'input',
      type: 'number',
      path: 'number',
    },
    {
      uid: '',
      kind: 'input',
      type: 'number',
      path: 'numberDisabled',
      disabled: true,
      readonly: true,
    },
    {
      uid: '',
      kind: 'input',
      type: 'number',
      path: 'numberPhone',
      props: {
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'number',
      path: 'numberWithHint',
      props: {
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'number',
      path: 'numberIcon',
      props: {
        icon: 'material-icons material-icons-phone_callback',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'number',
      path: 'numberIconRight',
      props: {
        icon: 'material-icons material-icons-phone_callback',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'number',
      path: 'height',
      props: {
        placeholder: 'Please enter your height in meters (min 0 and max 2.5)',
        step: 0.01,
      },
      validator: { type: 'number', minimum: 0, maximum: 2.5, required: true },
    },
  ],
});
