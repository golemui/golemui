export const textarea = (): any => ({
  uid: 'tab11',
  kind: 'layout',
  type: 'stack',
  children: [
    {
      uid: '',
      kind: 'input',
      type: 'textarea',
      path: 'textarea',
    },
    {
      uid: '',
      kind: 'input',
      type: 'textarea',
      path: 'textareaDisabled',
      disabled: true,
      readonly: true,
    },
    {
      uid: '',
      kind: 'input',
      type: 'textarea',
      path: 'textareaAutoGrow',
      props: {
        placeholder: 'This textarea will grow automatically when you type in it.',
        autoGrow: true,
        minimumHeight: 80,
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'textarea',
      path: 'textareaWithHint',
      props: {
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'textarea',
      path: 'textareaWithIcon',
      props: {
        icon: 'material-icons material-icons-phone_callback',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
        counterMode: 'current',
        minimumHeight: 80,
      },
      validator: { type: 'string', maxLength: 10, required: true },
    },
  ],
});
