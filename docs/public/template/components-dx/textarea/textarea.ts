import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'textarea',
      path: 'comments',
      label: 'Comments',
    },
  ],
});
