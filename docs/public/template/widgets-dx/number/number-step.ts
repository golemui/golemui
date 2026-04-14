import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'number',
      path: 'height',
      label: 'Height in meters',
      props: {
        step: 0.01,
      },
    },
  ],
});
