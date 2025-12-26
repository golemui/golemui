export const textarea = (): any => ({
  uid: 'tab11',
  kind: 'layout',
  widget: 'stack',
  children: [
    {
      uid: '',
      kind: 'control',
      widget: 'textarea',
      path: 'textarea',
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textarea',
      path: 'textareaDisabled',
      disabled: true,
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textarea',
      path: 'textareaPhone',
      props: {
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textarea',
      path: 'textareaWithHint',
      props: {
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textarea',
      path: 'textareaWithIcon',
      props: {
        icon: 'material-icons material-icons-phone_callback',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
        counterMode: 'current',
      },
      validator: { type: 'string', maxLength: 10, required: true },
    },
  ],
});
