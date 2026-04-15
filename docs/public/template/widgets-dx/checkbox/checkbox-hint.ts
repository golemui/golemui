import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'checkbox',
      path: 'newsletter',
      label: 'Subscribe to newsletter',
      props: {
        hint: 'We promise not to spam your inbox.',
      },
    },
  ],
});
