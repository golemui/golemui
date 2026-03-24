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
import { flex } from './tabs/flex';

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
        defaultOpen: 'tabAlert',
        tabs: [
          { label: 'Alert Component', uid: 'tabAlert' },
          { label: 'Flex Layout', uid: 'tabFlex' },
          { label: 'Grid Layout', uid: 'tabGrid' },
          { label: 'Repeater Component', uid: 'tabRepeater' },
          { label: 'Checkbox Component', uid: 'tabCheckbox' },
          { label: 'Accordion Layout', uid: 'tabAccordion' },
          { label: 'Textinput Component', uid: 'tabTextinput' },
          { label: 'Select Component', uid: 'tabSelect' },
          { label: 'Number Component', uid: 'tabNumber' },
          { label: 'Radiogroup Component', uid: 'tabRadiogroup' },
          { label: 'Toggle Component', uid: 'tabToggle' },
          { label: 'Textarea Component', uid: 'tabTextarea' },
          { label: 'Date Components', uid: 'tabDate' },
          { label: 'Currency Component', uid: 'tabCurrency' },
          { label: 'List Component', uid: 'tabList' },
          { label: 'Dropdown Component', uid: 'tabDropdown' },
          { label: 'Password Component', uid: 'tabPassword' },
        ],
      },
      on: { change: 'onTabEvent' },
      children: [
        alert('tabAlert'),
        flex('tabFlex'),
        grid('tabGrid'),
        repeater('tabRepeater'),
        checkbox('tabCheckbox'),
        accordion('tabAccordion'),
        textinput('tabTextinput'),
        select('tabSelect'),
        number('tabNumber'),
        radiogroup('tabRadiogroup'),
        toggle('tabToggle'),
        textarea('tabTextarea'),
        calendar('tabDate'),
        currency('tabCurrency'),
        list('tabList'),
        dropdown('tabDropdown'),
        password('tabPassword'),
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
