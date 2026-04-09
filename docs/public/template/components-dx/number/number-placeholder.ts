import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'number',
      path: 'height',
      label: 'Height in meters',
      props: {
        placeholder: 'Please enter your height in meters (min 0 and max 2.5)',
      },
    },
  ],
});
