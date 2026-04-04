import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'alert_default',
      kind: 'display',
      type: 'alert',
      props: {
        text: 'This is a default alert message.',
      },
    },
  ],
});
