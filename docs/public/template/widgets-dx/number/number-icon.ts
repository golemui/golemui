import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'number',
      path: 'number',
      label: 'Phone Number',
      props: {
        icon: 'phone_callback',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
    {
      kind: 'input',
      type: 'number',
      path: 'number',
      label: 'Phone Number',
      props: {
        icon: 'phone_callback',
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
  ],
});
