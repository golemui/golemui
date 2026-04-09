import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'radiogroup_hint',
      kind: 'input',
      type: 'radiogroup',
      path: 'preference',
      label: 'Select your preference',
      props: {
        options: [
          {
            label: 'Email',
            value: 'email',
          },
          {
            label: 'SMS',
            value: 'sms',
          },
        ],
        hint: 'We will use this method to send you notifications.',
      },
    },
  ],
});
