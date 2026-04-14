import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'password',
      path: 'password',
      label: 'Password',
      props: {
        icon: 'fas fa-lock',
      },
    },
  ],
});
