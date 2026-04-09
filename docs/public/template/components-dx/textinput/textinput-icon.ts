import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'textinput',
      path: 'phoneNumber',
      label: 'Phone Number',
      props: {
        icon: 'phone_callback',
      },
    },
    {
      kind: 'input',
      type: 'textinput',
      path: 'email',
      label: 'Email',
      props: {
        icon: 'alternate_email',
      },
    },
  ],
});
