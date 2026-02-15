import * as Core from '@golemui/core';
import { golemForm } from '@golemui/shared-vanilla';
import { Example } from './types';

type FormType = {
  registerMode: boolean;
  user?: { name: string };
};

const data: FormType = { registerMode: false };
const states = {
  register: '$form.registerMode === true',
};

type States = keyof typeof states;

type CustomHeadingWidgetProps = {
  text: string;
  level?: number;
};
type CustomHeadingWidget = Core.DisplayWidget<States, FormType, CustomHeadingWidgetProps>;

const form = golemForm<FormType, CustomHeadingWidget>().create({
  states,
  form: [
    {
      kind: 'display',
      type: 'heading',
      props: {
        text: ({ $form }) => {
          if ($form.user?.name && !$form.registerMode) {
            return `Hello ${$form.user.name}`;
          }
          return 'Register';
        },
      },
    },
    {
      kind: 'input',
      type: 'textinput',
      path: 'user.name',
      label: ({ $form }) => {
        return $form.registerMode ? 'Name in Register' : 'Name in Login';
      },
      validator: ({ $form }) => {
        return $form.registerMode
          ? { type: 'string', required: true }
          : { type: 'custom', allowedNames: ['Joan', 'Raul'] };
      },
    },
    (api) => ({
      kind: 'input',
      type: 'textinput',
      path: 'user.lastName',
      label: api?.errors
        ? 'ERRORS!!!!!!!'
        : api?.$form.user?.name
          ? `${api.$form.user.name}'s last name`
          : 'Last Name',
      validator: {
        type: 'string',
        minLength: 3,
      },
    }),
    {
      kind: 'input',
      type: 'checkbox',
      path: 'registerMode',
      label: ({ $form }) => {
        return $form.registerMode ? 'Change to Login' : 'Change to Register';
      },
      props: {
        checkboxPosition: ({ $form }) => {
          return $form.registerMode ? 'left' : 'right';
        },
      },
      on: {
        change: ({ $form }) => {
          return $form.registerMode ? 'registerOnHandler' : 'loginOnHandler';
        },
      },
    },
    {
      kind: 'action',
      type: 'button',
      label: ({ $form }) => {
        return $form.registerMode ? 'Register' : 'Login';
      },
      on: {
        click: ({ $form }) => {
          return $form.registerMode ? 'handleRegister' : 'handleLogin';
        },
      },
    },
  ],
});

/**
 * i18next Resource Bundle
 */
const resources = {};

export const reactiveFunctions: Example = {
  data,
  form,
  resources,
};
