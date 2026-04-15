import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'markdown',
      path: 'contentRemaining',
      label: 'Content',
      props: {
        counterMode: 'remaining',
      },
      validator: {
        type: 'string',
        maxLength: 200,
        required: true,
      },
    },
    {
      kind: 'input',
      type: 'markdown',
      path: 'contentCurrent',
      label: 'Content',
      props: {
        counterMode: 'current',
      },
      validator: {
        type: 'string',
        maxLength: 200,
        required: true,
      },
    },
  ],
});
