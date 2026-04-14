import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'markdown',
      path: 'content',
      label: 'Content',
      props: {
        tools: ['H', 'B', 'I', 'S', '|', 'UL'],
      },
    },
  ],
});
