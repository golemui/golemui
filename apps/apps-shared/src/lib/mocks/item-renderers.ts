import { defineForm } from '@golemui/core';
import { Example } from './types';

const thousandsOfItems = Array.from({ length: 1000 }, (_, i) => i);

const data = { 'complex-renderer': 'one', 'dropdown-complex-renderer': 'two' };

const form = defineForm({
  states: {
    register: '$form.registerMode === true',
  },
  form: [
    {
      uid: '',
      kind: 'input',
      type: 'dropdown',
      path: 'dropdown-default-renderer',
      props: {
        itemHeight: 30,
        hint: 'Virtual scroll list with 1000 items.',
        items: thousandsOfItems,
      },
      validator: { type: 'string', required: true },
    },
    {
      uid: '',
      kind: 'input',
      type: 'dropdown',
      path: 'dropdown-complex-renderer',
      props: {
        height: 150,
        itemHeight: 60,
        valueField: 'value',
        itemRenderer: 'complexListItemRenderer',
        items: [
          { value: 'one', title: 'This is One', description: 'Blah blah blah Lorem Ipsum' },
          { value: 'two', title: 'Two this is', description: 'Ok, blah blah Ipsum Lorem' },
          { value: 'three', title: 'Three this is', description: 'Lorem Ipsum blah blah blah' },
          { value: 'four', title: 'Four this is', description: 'bluh bluh bluh' },
          { value: 'five', title: 'Five this is', description: 'bleh bleh' },
          { value: 'six', title: 'Six this is', description: 'blih blih blih' },
        ],
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'list',
      path: 'default-renderer',
      props: {
        itemHeight: 20,
        hint: 'Virtual scroll list with 1000 items.',
        items: thousandsOfItems,
      },
      validator: { type: 'string', required: true },
    },
    {
      uid: '',
      kind: 'input',
      type: 'list',
      path: 'complex-renderer',
      props: {
        height: 150,
        itemHeight: 60,
        valueField: 'value',
        itemRenderer: 'complexListItemRenderer',
        items: [
          { value: 'one', title: 'This is One', description: 'Blah blah blah Lorem Ipsum' },
          { value: 'two', title: 'Two this is', description: 'Ok, blah blah Ipsum Lorem' },
          { value: 'three', title: 'Three this is', description: 'Lorem Ipsum blah blah blah' },
          { value: 'four', title: 'Four this is', description: 'bluh bluh bluh' },
          { value: 'five', title: 'Five this is', description: 'bleh bleh' },
          { value: 'six', title: 'Six this is', description: 'blih blih blih' },
        ],
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'user.height',
      defaultValue: '170',
      validator: { type: 'string', required: true },
      include: { in: ['register'] },
    },
    {
      uid: '',
      kind: 'input',
      type: 'checkbox',
      label: 'Register',
      path: 'registerMode',
    },
    {
      uid: '',
      kind: 'action',
      type: 'button',
      label: 'Login',
      'label.register': 'Register',
      on: {
        click: 'submit',
        'click.register': 'handleRegister',
      },
    },
  ],
});

/**
 * i18next Resource Bundle
 */
const resources = {};

export const itemRenderers: Example = {
  data,
  form,
  resources,
};
