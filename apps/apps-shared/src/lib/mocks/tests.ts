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
        validator: {
          type: 'string',
          required: true,
          minLength: 3,
        },
      },
      {
        uid: 'is-vip',
        kind: 'input',
        label: 'Is VIP',
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
      {
        uid: 'alert1',
        kind: 'display',
        type: 'alert',
        props: {
          text: 'One Error: {{$errors.userName}}',
        },
        include: { when: '$errors.userName?.length === 1' },
      },
      {
        uid: 'alert2',
        kind: 'display',
        type: 'alert',
        props: {
          text: 'Two Errors: {{$errors.userName}} becasue form is invalid: {{$formIsInvalid}}',
        },
        include: { when: '$errors.userName?.length === 2' },
      },
      {
        uid: 'button',
        kind: 'action',
        type: 'button',
        label: 'Send',
        disabled: { when: '$formIsInvalid' },
        on: {
          click: 'send',
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
  form: getFormDefinition(),
  resources,
};
