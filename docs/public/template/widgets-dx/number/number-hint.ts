import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'number',
      path: 'number',
      label: 'Phone Number',
      props: {
        hint: 'This is a hint',
        placeholder: 'Please enter your phone number',
      },
    },
  ],
});
