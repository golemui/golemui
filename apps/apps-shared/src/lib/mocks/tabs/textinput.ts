export const textinput = (): any => ({
  uid: 'tab6',
  kind: 'layout',
  type: 'flex',
  children: [
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'textinput',
    },
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'textinputDisabled',
      disabled: true,
      readonly: true,
    },
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'textinputPhone',
      props: {
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'textinputWithHint',
      props: {
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'textinputWithIcon',
      props: {
        icon: 'material-icons material-icons-phone_callback',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'textinputIconRight',
      props: {
        icon: 'material-icons material-icons-phone_callback',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
      validator: { type: 'string', required: true },
    },
  ],
});
