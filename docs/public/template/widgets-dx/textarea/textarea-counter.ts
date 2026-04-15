import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'textarea',
      path: 'commentsRemaining',
      label: 'Comments',
      props: {
        counterMode: 'remaining',
      },
      validator: {
        type: 'string',
        maxLength: 10,
        required: true,
      },
    },
    {
      kind: 'input',
      type: 'textarea',
      path: 'commentsCurrent',
      label: 'Comments',
      props: {
        counterMode: 'current',
      },
      validator: {
        type: 'string',
        maxLength: 10,
        required: true,
      },
    },
  ],
});
