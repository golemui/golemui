import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'alert_levels',
      kind: 'display',
      type: 'alert',
      props: {
        text: 'Operation successful!',
        level: 'success',
      },
    },
    {
      uid: 'alert_levels_2',
      kind: 'display',
      type: 'alert',
      props: {
        text: 'Potential issue detected.',
        level: 'warning',
      },
    },
    {
      uid: 'alert_levels_3',
      kind: 'display',
      type: 'alert',
      props: {
        text: 'Operation failed.',
        level: 'error',
      },
    },
  ],
});
