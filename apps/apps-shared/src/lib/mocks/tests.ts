import * as Core from '@golemui/core';
import { Example } from './types';

const data = { userName: 'Grace', isVip: false };

const getFormDefinition = () =>
  Core.defineForm({
    states: {
      vip: '$form.isVip === true',
    },
    form: [
      {
        uid: 'user-name',
        kind: 'input',
        type: 'textinput',
        path: 'userName',
      },
      {
        uid: 'is-vip',
        kind: 'input',
        type: 'checkbox',
        path: 'isVip',
      },
      {
        uid: 'vip-message',
        kind: 'display',
        type: 'alert',
        props: {
          text: 'Welcome VIP: {{$form.userName}}',
        },
        include: { in: ['vip'] },
      },
    ],
  });

/**
 * i18next Resource Bundle
 */
const resources = {};

export const tests: Example = {
  data,
  form: getFormDefinition(),
  resources,
};
