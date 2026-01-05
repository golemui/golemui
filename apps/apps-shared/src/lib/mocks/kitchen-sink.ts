import { defineForm } from '@golemui/core';
import { alert } from './tabs/alert';
import { stack } from './tabs/stack';
import { repeater } from './tabs/repeater';
import { checkbox } from './tabs/checkbox';
import { accordion } from './tabs/accordion';
import { textinput } from './tabs/textinput';
import { select } from './tabs/select';
import { number } from './tabs/number';
import { radiogroup } from './tabs/radiogroup';
import { toggle } from './tabs/toggle';
import { textarea } from './tabs/textarea';
import { calendar } from './tabs/calendar';

export const kitchenSink = defineForm({
  states: {
    limitReached: '$form.repeaters.users?.length === 5',
    hasSubregionSelect: `!!$form.selects.subregion`,
    hasSubregionRadiogroup: `!!$form.radiogroups.subregion`,
  },
  form: [
    {
      uid: '',
      kind: 'display',
      widget: 'heading',
      props: {
        text: 'KITCHEN SINK',
        level: 3,
      },
    },
    {
      uid: '',
      kind: 'layout',
      widget: 'tabs',
      props: {
        defaultOpen: 'tab12',
        tabs: [
          { label: 'Alert Component', uid: 'tab1' },
          { label: 'Stack Layout', uid: 'tab2' },
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
        ],
      },
      on: { change: 'onTabEvent' },
      children: [
        alert(),
        stack(),
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
      ],
    },
    {
      uid: '',
      kind: 'interactive',
      widget: 'button',
      label: 'Create',
      on: {
        click: 'submit',
      },
    },
  ],
});

export const kitchenSinkData = {
  listName: 'Development Team',
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
        firstName: 'Bob',
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
