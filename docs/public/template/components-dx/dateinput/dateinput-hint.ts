import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'dateInput',
      path: 'birthDate',
      label: 'Birth Date',
      props: {
        hint: 'Please enter your date of birth',
      },
    },
  ],
});
