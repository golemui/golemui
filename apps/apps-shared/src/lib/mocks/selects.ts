import { defineForm } from '@golemui/core';

export const selectsData = {
  greeting: 'bye',
  wrongGreeting: 'aaaaaa',
  greetingIndex: 2,
};

export const selects = defineForm({
  states: {
    hasSubregion: `!!$form.selects?.subregion`,
  },
  form: [
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: 'name',
    },
    {
      uid: '',
      kind: 'control',
      widget: 'checkbox',
      path: 'aaaa',
      readonly: true,
    },
    {
      uid: '',
      kind: 'control',
      widget: 'checkbox',
      path: 'bbb',
      readonly: false,
    },
    {
      uid: '',
      kind: 'control',
      widget: 'select',
      path: 'greeting',
      label: 'Greeting',
      readonly: true,
      props: {
        options: ['hello', 'bye'],
        placeholder: 'Please, select an option',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'select',
      path: 'wrongGreeting',
      props: {
        options: ['hello', 'bye'],
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'select',
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
      kind: 'control',
      widget: 'select',
      path: 'selects.subregion',
      label: 'Country subregion',
      on: {
        load: 'getSubregionsForSelect',
        change: 'getCountriesForSelect',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'select',
      path: 'selects.country',
      include: { in: ['hasSubregion'] },
    },
    {
      uid: '',
      kind: 'interactive',
      widget: 'button',
      label: 'Send',
      disabled: true,
      'disabled.hasSubregion': false,
      on: {
        click: 'sendCountry',
      },
    },
  ],
});
