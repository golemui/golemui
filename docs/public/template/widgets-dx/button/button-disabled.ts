import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'button_basic',
      kind: 'action',
      type: 'button',
      label: 'Click Me',
      disabled: true,
    },
  ],
});
