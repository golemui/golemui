import { golemForm } from '@golemui/gui-shared';
import { Example } from './types';

const data = {
  md: `### Something
- **hello**: _world_
- **seeyoulater**: _aligator_
`,
};

const form = golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'markdown',
      path: 'md',
      props: {
        tools: ['H', 'B', 'I', '|', 'OL', 'UL', '|', 'L', 'Q', '|'],
        autoGrow: true,
        defaultOpenPreview: true,
      },
      validator: { type: 'string', required: true, minLength: 2 },
    },
    {
      kind: 'action',
      type: 'button',
      label: 'Login',
      on: {
        click: 'submit',
      },
    },
  ],
});

/**
 * i18next Resource Bundle
 */
const resources = {};

export const tests: Example = {
  data,
  form,
  resources,
};
