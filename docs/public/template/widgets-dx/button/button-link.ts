import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'button_link',
      kind: 'action',
      type: 'button',
      label: 'Click Me',
      props: {
        variant: 'link',
      },
    },
  ],
});
