import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'action',
      type: 'button',
      label: '',
      props: {
        icon: 'save',
      },
    },
  ],
});
