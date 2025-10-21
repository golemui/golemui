import { defineForm } from '@formforge/core';

export const selectsData = {
  greeting: 'bye',
  wrongGreeting: 'aaaaaa',
  greetingIndex: 2,
};

export const selects = defineForm({
  states: {
    hasSubregion: `!!$form.subregion`,
  },
  form: {
    uid: '',
    kind: 'layout',
    widget: 'stack',
    children: [
      {
        uid: '',
        kind: 'control',
        widget: 'select',
        path: 'greeting',
        label: 'Greeting',
        props: {
          options: ['hello', 'bye'],
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
        path: 'subregion',
        label: 'Country subregion',
        on: {
          load: 'getSubregions',
          change: 'getCountries',
        },
      },
      {
        uid: '',
        kind: 'control',
        widget: 'select',
        path: '#/properties/country',
        include: { in: ['hasSubregion'] },
      },
      {
        uid: '',
        kind: 'button',
        widget: 'button',
        label: 'Send',
        disabled: true,
        'disabled.hasSubregion': false,
        on: {
          click: 'sendCountry',
        },
      },
    ],
  },
});
