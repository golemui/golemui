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
import { grid } from './tabs/grid';
import { textarea } from './tabs/textarea';
import { textinput } from './tabs/textinput';
import { toggle } from './tabs/toggle';
import { Example } from './types';
import { golemForm } from '@golemui/gui-shared';
import * as Core from '@golemui/core';
import { password } from './tabs/password';

const states = {
  limitReached: '$form.repeaters.users?.length === 5',
  hasSubregionSelect: `!!$form.selects.subregion`,
  hasSubregionRadiogroup: `!!$form.radiogroups.subregion`,
};

type States = keyof typeof states;

type CustomHeadingWidgetProps = {
  text: string;
  level?: number;
};
type CustomHeadingWidget = Core.DisplayWidget<States, any, CustomHeadingWidgetProps>;

const form = golemForm<any, CustomHeadingWidget>().create({
  states,
  form: [
    {
      kind: 'display',
      type: 'heading',
      props: {
        text: 'KITCHEN SINK',
        level: 1,
      },
    },
    {
      kind: 'layout',
      type: 'tabs',
      props: {
        defaultOpen: 'tab2',
        tabs: [
          { label: 'Alert Component', uid: 'tab1' },
          { label: 'Grid Layout', uid: 'tab2' },
          { label: 'Repeater Component', uid: 'tab3' },
          { label: 'Checkbox Component', uid: 'tab4' },
          { label: 'Accordion Layout', uid: 'tab5' },
          { label: 'Textinput Component', uid: 'tab6' },
          { label: 'Select Component', uid: 'tab7' },
          { label: 'Number Component', uid: 'tab8' },
          { label: 'Radiogroup Component', uid: 'tab9' },
          { label: 'Toggle Component', uid: 'tab10' },
          { label: 'Textarea Component', uid: 'tab_textarea' },
          { label: 'Date Components', uid: 'tab12' },
          { label: 'Currency Component', uid: 'tab13' },
          { label: 'List Component', uid: 'tab14' },
          { label: 'Dropdown Component', uid: 'tab15' },
          { label: 'Password Component', uid: 'tab16' },
        ],
      },
      on: { change: 'onTabEvent' },
      children: [
        alert(),
        grid(),
        repeater(),
        checkbox(),
        accordion(),
        textinput(),
        select(),
        number(),
        radiogroup(),
        toggle(),
        textarea('tab_textarea'),
        calendar(),
        currency(),
        list(),
        dropdown(),
        password(),
      ],
    },
    {
      kind: 'action',
      type: 'button',
      label: 'Create',
      props: {
        icon: 'save',
        iconPosition: 'right',
      },
      on: {
        click: 'submit',
      },
    } as any, // TODO: why is this failing
  ],
});

const data = {
  listName: 'Development Team',
  currency: 1000000,
  dropdowns: {
    defaultListRenderer: 0,
    disabledList: 0,
    customItemRenderer: 'two',
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
