import { defineForm } from '@golemui/core';
import { Example } from './types';

const data = {
  greeting: 'bye',
  wrongGreeting: 'aaaaaa',
  greetingIndex: 2,
};

const form = defineForm({
  states: {
    hasSubregion: `!!$form.selects?.subregion`,
    hasName: `$form.name && $form.name.length > 0`,
  },
  form: [
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      label: 'Name',
      path: 'name',
    },
    {
      uid: '',
      kind: 'input',
      type: 'select',
      path: 'greeting',
      label: 'Greeting',
      disabled: true,
      'disabled.hasName': false,
      props: {
        options: ['hello', 'bye'],
        placeholder: 'Please, select an option',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'select',
      path: 'wrongGreeting',
      props: {
        options: ['hello', 'bye'],
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'select',
      path: 'greetingIndex',
      props: {
        options: [
          { label: 'hello.1', value: 1 },
          { label: 'bye.2', value: 2 },
        ],
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'select',
      path: 'selects.subregion',
      label: 'Country subregion',
      on: {
        load: 'getSubregionsForSelect',
        change: 'getCountriesForSelect',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'select',
      path: 'selects.country',
      include: { in: ['hasSubregion'] },
    },
    {
      uid: '',
      kind: 'action',
      type: 'button',
      label: 'Send',
      //disabled: true,
      //'disabled.hasSubregion': false,
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

export const selects: Example = {
  data,
  form,
  resources,
};
