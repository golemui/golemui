import { defineForm } from '@golemui/core';
import { accordion } from './tabs/accordion';
import { alert } from './tabs/alert';
import { calendar } from './tabs/calendar';
import { checkbox } from './tabs/checkbox';
import { currency } from './tabs/currency';
import { dropdown } from './tabs/dropdown';
import { list } from './tabs/list';
import { number } from './tabs/number';
import { radiogroup } from './tabs/radiogroup';
import { repeater } from './tabs/repeater';
import { select } from './tabs/select';
import { flex } from './tabs/flex';
import { textarea } from './tabs/textarea';
import { textinput } from './tabs/textinput';
import { toggle } from './tabs/toggle';
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
      kind: 'layout',
      type: 'tabs',
      props: {
        defaultOpen: 'tab15',
        tabs: [
          { label: 'Alert Component', uid: 'tab1' },
          { label: 'Flex Layout', uid: 'tab2' },
          { label: 'Repeater Component', uid: 'tab3' },
          { label: 'Checkbox Component', uid: 'tab4' },
          { label: 'Accordion Layout', uid: 'tab5' },
          { label: 'Textinput Component', uid: 'tab6' },
          { label: 'Select Component', uid: 'tab7' },
          { label: 'Number Component', uid: 'tab8' },
          { label: 'Radiogroup Component', uid: 'tab9' },
          { label: 'Toggle Component', uid: 'tab10' },
          { label: 'Textarea Component', uid: 'tab11' },
          { label: 'Calendar Component', uid: 'tab12' },
          { label: 'Currency Component', uid: 'tab13' },
          { label: 'List Component', uid: 'tab14' },
          { label: 'Dropdown Component', uid: 'tab15' },
        ],
      },
      on: { change: 'onTabEvent' },
      children: [
        alert(),
        flex(),
        repeater(),
        checkbox(),
        accordion(),
        textinput(),
        select(),
        number(),
        radiogroup(),
        toggle(),
        textarea(),
        calendar(),
        currency(),
        list(),
        dropdown(),
      ],
    },
    {
      uid: '',
      kind: 'action',
      type: 'button',
      label: 'Create',
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
const resources = {};

export const kitchenSink: Example = {
  data,
  form,
  resources,
};
