import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'display',
      type: 'alert',
      props: {
        text: 'Default level',
        level: 'default',
      },
    },
    {
      kind: 'display',
      type: 'alert',
      props: {
        text: 'Info level',
        level: 'info',
      },
    },
    {
      kind: 'display',
      type: 'alert',
      props: {
        text: 'Success level',
        level: 'success',
      },
    },
    {
      kind: 'display',
      type: 'alert',
      props: {
        text: 'Warning level',
        level: 'warning',
      },
    },
    {
      kind: 'display',
      type: 'alert',
      props: {
        text: 'Error level',
        level: 'error',
      },
    },
  ],
});
