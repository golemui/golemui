export const textinput = (uid: string): any => ({
  uid,
  kind: 'layout',
  type: 'flex',
  children: [
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'textinput',
      props: {
        autocomplete: 'off',
      },
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
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'textinputCustomValidator',
      props: {
        hint: 'Try a name other than John or Jane',
        placeholder: 'Enter a name',
      },
      validator: { type: 'custom', allowedNames: ['John', 'Jane'] },
    },
  ],
});
