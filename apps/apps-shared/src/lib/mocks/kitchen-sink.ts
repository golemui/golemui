import { defineForm } from '@golemui/core';
import { accordion } from './tabs/accordion';
import { alert } from './tabs/alert';
import { checkbox } from './tabs/checkbox';
import { number } from './tabs/number';
import { radiogroup } from './tabs/radiogroup';
import { repeater } from './tabs/repeater';
import { select } from './tabs/select';
import { stack } from './tabs/stack';
import { textarea } from './tabs/textarea';
import { textinput } from './tabs/textinput';
import { toggle } from './tabs/toggle';

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
        defaultOpen: 'tab11',
        tabs: [
          { label: 'Alert', uid: 'tab1' },
          { label: 'Stack', uid: 'tab2' },
          { label: 'Repeater', uid: 'tab3' },
          { label: 'Checkbox', uid: 'tab4' },
          { label: 'Accordion', uid: 'tab5' },
          { label: 'Textinput', uid: 'tab6' },
          { label: 'Select', uid: 'tab7' },
          { label: 'Number', uid: 'tab8' },
          { label: 'Radiogroup', uid: 'tab9' },
          { label: 'Toggle', uid: 'tab10' },
          { label: 'Textarea', uid: 'tab11' },
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
