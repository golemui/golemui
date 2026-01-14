import { defineForm } from '@golemui/core';

export const testsData = {};

export const tests = defineForm({
  states: {
    register: '$form.registerMode === true',
  },
  form: [
    {
      uid: '',
      kind: 'control',
      widget: 'list',
      path: 'default-renderer',
      props: {
        items: ['one', 'two'],
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'list',
      path: 'complex-renderer',
      props: {
        valueField: 'value',
        itemRenderer: 'complexListItemRenderer',
        items: [
          { value: 'one', title: 'This is One', description: 'Blah blah blah Lorem Ipsum' },
          { value: 'two', title: 'Two this is', description: 'Ok, blah blah Ipsum Lorem' },
        ],
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: 'user.height',
      defaultValue: '170',
      validator: { type: 'string', required: true },
      include: { in: ['register'] },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'checkbox',
      label: 'Register',
      path: 'registerMode',
    },
    {
      uid: '',
      kind: 'interactive',
      widget: 'button',
      label: 'Login',
      'label.register': 'Register',
      on: {
        click: 'handleLogin',
        'click.register': 'handleRegister',
      },
    },
  ],
});
