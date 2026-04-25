import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'toggle',
      path: 'darkMode',
      label: 'Dark mode',
      props: {
        togglePosition: 'left',
      },
    },
  ],
});
