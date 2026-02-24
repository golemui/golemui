import { defineForm } from '@golemui/core';
import { Example } from './types';

const data = {};

const form = defineForm({
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
          props: { type: 'email', placeholder: 'example@domain.com' },
        },
        {
          uid: 'login-password',
          kind: 'input',
          type: 'password',
          path: 'login.password',
          props: { type: 'password', placeholder: 'Enter your password...' },
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
