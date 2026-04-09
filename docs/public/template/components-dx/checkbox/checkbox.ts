import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'checkbox',
      path: 'createUser',
      label: 'Create a new user?',
    },
  ],
});
