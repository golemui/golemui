import { golemForm } from '@golemui/gui-shared';
import { Example } from './types';

const data = {
  md: `
  ### Something
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
        tools: ['H', 'B', 'I', '|', 'L', 'Q'],
        writeTabLabel: '🖊️ Write',
        previewTabLabel: '👁️ Preview',
      },
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
