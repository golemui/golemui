import { defineForm } from '@golemui/core';
import { Example } from './types';

const form = defineForm({
  states: {
    limitReached: '$form.repeaters.users?.length === 5',
    hasSubregionSelect: `!!$form.selects.subregion`,
    hasSubregionRadiogroup: `!!$form.radiogroups.subregion`,
  },
  form: [
    {
      uid: '',
      kind: 'display',
      type: 'heading',
      props: {
        text: 'KITCHEN SINK',
        level: 3,
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'textinput',
    },
    {
      uid: '',
      kind: 'action',
      type: 'button',
      label: 'Create',
      props: {
        icon: 'material-icons material-icons-save',
        iconPosition: 'right',
      },
      on: {
        click: 'submit',
      },
    },
  ],
});

const data = {
  listName: 'Development Team',
  currency: 1000000,
  dropdowns: {
    defaultListRenderer: 0,
    disabledList: 0,
    customItemRenderer: 'one',
  },
  lists: {
    defaultListRenderer: 0,
    disabledList: 0,
    customItemRenderer: 'one',
  },
  selects: {
    greeting: 'bye',
    wrongGreeting: 'aaaaaa',
    greetingIndex: 2,
  },
  radiogroups: {
    greeting: 'bye',
    wrongGreeting: 'aaaaaa',
    greetingIndex: 2,
  },
  repeaters: {
    users: [
      {
        firstName: 'Alice',
        lastName: 'Johnson',
      },
      {
        firstName: '',
        lastName: 'Smith',
      },
      {
        firstName: 'Charlie',
      },
      {
        firstName: 'Diana',
        lastName: 'Rodriguez',
      },
    ],
  },
};

/**
 * i18next Resource Bundle
 */
const resources = {
  fa: {
    translation: {
      rtl: {
        username: 'نام کاربری',
        password: 'رمز عبور',
      },
    },
  },
};

export const template: Example = {
  data,
  form,
  resources,
};
