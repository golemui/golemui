import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'toggle',
      path: 'notificationsEnabled',
      label: 'Enable push notifications',
    },
  ],
});
