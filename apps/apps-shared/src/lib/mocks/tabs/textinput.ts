export const textinput = (uid: string): any => ({
  uid,
  kind: 'layout',
  type: 'grid',
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
        icon: 'phone_callback',
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
        icon: 'phone_callback',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
      validator: { type: 'string', required: true },
    },
  ],
});
