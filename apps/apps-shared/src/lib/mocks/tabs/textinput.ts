export const textinput = (): any => ({
  uid: 'tab6',
  kind: 'layout',
  widget: 'stack',
  children: [
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: 'textinput',
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: 'textinputDisabled',
      disabled: true,
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: 'textinputPhone',
      props: {
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: 'textinputWithHint',
      props: {
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: 'textinputWithIcon',
      props: {
        icon: 'material-icons material-icons-phone_callback',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: 'textinputIconRight',
      props: {
        icon: 'material-icons material-icons-phone_callback',
        iconPosition: 'right',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
      validator: { type: 'string', required: true },
    },
  ],
});
