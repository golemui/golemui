import { golemForm } from '@golemui/gui-components';
import { Example } from './types';

const data = {};

const form = golemForm().create({
  form: [
    {
      uid: 'login-flex',
      kind: 'layout',
      type: 'flex',
      children: [
        {
          uid: 'login-email',
          kind: 'input',
          type: 'textinput',
          path: 'login.email',
          props: { placeholder: 'example@domain.com' },
        },
        {
          uid: 'login-password',
          kind: 'input',
          type: 'password',
          path: 'login.password',
          props: { placeholder: 'Enter your password...' },
        },
        {
          uid: 'login-submit',
          kind: 'action',
          type: 'button',
          label: 'Login',
        },
      ],
    },
  ],
});

/**
 * i18next Resource Bundle
 */

const resources = {};

export const tiny: Example = {
  data,
  form,
  resources,
};
