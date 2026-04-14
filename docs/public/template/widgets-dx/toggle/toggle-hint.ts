import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'toggle',
      path: 'marketingEmails',
      label: 'Receive marketing emails',
      props: {
        hint: 'We\'ll only send you relevant product updates.',
      },
    },
  ],
});
