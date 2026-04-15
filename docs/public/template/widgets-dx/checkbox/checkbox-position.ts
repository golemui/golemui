import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'checkbox',
      path: 'acceptConditions',
      label: 'Yes, I have read terms and conditions',
      props: {
        checkboxPosition: 'left',
      },
    },
  ],
});
