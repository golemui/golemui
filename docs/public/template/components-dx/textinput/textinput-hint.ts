import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'textinput',
      path: 'password',
      label: 'Street Address',
      props: {
        hint: 'Your street address as stated in your Document ID',
      },
    },
  ],
});
