import { defineForm } from '@golemui/core';

type FormData = {
  registerMode: boolean;
  user?: { name: string };
};

export const reactiveFunctionsData: FormData = { registerMode: false };

export const reactiveFunctions = defineForm<FormData>({
  states: {
    register: '$form.registerMode === true',
  },
  form: [
    {
      uid: '',
      kind: 'display',
      widget: 'heading',
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
      uid: '',
      kind: 'control',
      widget: 'textinput',
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
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: 'user.lastName',
      label: api?.errors
        ? 'ERRORS!!!!!!!'
        : api?.$form?.user?.name
          ? `${api.$form.user.name}'s last name`
          : 'Last Name',
      validator: {
        type: 'string',
        minLength: 3,
      },
    }),
    {
      uid: '',
      kind: 'control',
      widget: 'checkbox',
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
      uid: '',
      kind: 'interactive',
      widget: 'button',
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
