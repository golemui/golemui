export const password = (): any => ({
  uid: 'tab16',
  kind: 'layout',
  type: 'grid',
  children: [
    {
      uid: '',
      kind: 'input',
      type: 'password',
      path: 'password',
    },
    {
      uid: '',
      kind: 'input',
      type: 'password',
      path: 'passwordDisabled',
      disabled: true,
      readonly: true,
    },
    {
      uid: '',
      kind: 'input',
      type: 'password',
      path: 'passwordPhone',
      props: {
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'password',
      path: 'passwordWithHint',
      props: {
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'password',
      path: 'passwordWithIcon',
      props: {
        icon: 'phone_callback',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'password',
      path: 'passwordIconRight',
      props: {
        icon: 'lock',
        showPasswordIcon: 'visibility',
        hidePasswordIcon: 'visibility_off',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
      validator: { type: 'string', required: true },
    },
  ],
});
