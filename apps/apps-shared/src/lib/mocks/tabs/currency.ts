export const currency = (): any => ({
  uid: 'tab13',
  kind: 'layout',
  widget: 'stack',
  children: [
    {
      uid: '',
      kind: 'control',
      widget: 'currency',
      path: 'currency',
    },
    {
      uid: '',
      kind: 'control',
      widget: 'currency',
      path: 'currencyDisabled',
      disabled: true,
    },
    {
      uid: '',
      kind: 'control',
      widget: 'currency',
      path: 'currencyPhone',
      props: {
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'currency',
      path: 'currencyWithHint',
      props: {
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'currency',
      path: 'currencyWithIcon',
      props: {
        icon: 'material-icons material-icons-phone_callback',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'currency',
      path: 'currencyIconRight',
      props: {
        icon: 'material-icons material-icons-phone_callback',
        iconPosition: 'right',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
      validator: { type: 'number', required: true },
    },
  ],
});
