export const number = (): any => ({
  uid: 'tab8',
  kind: 'layout',
  widget: 'stack',
  children: [
    {
      uid: '',
      kind: 'control',
      widget: 'number',
      path: 'number',
    },
    {
      uid: '',
      kind: 'control',
      widget: 'number',
      path: 'numberDisabled',
      disabled: true,
      readonly: true,
    },
    {
      uid: '',
      kind: 'control',
      widget: 'number',
      path: 'numberPhone',
      props: {
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'number',
      path: 'numberWithHint',
      props: {
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'number',
      path: 'numberIcon',
      props: {
        icon: 'material-icons material-icons-phone_callback',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'number',
      path: 'numberIconRight',
      props: {
        icon: 'material-icons material-icons-phone_callback',
        iconPosition: 'right',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'number',
      path: 'height',
      props: {
        placeholder: 'Please enter your height in meters (min 0 and max 2.5)',
        step: 0.01,
      },
      validator: { type: 'number', minimum: 0, maximum: 2.5, required: true },
    },
  ],
});
