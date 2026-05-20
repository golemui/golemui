import '@golemui/gui-components/index.css';
import '@golemui/gui-lit';
import { gui } from '@golemui/gui-shared';
import './styles.css';

const COUNTRIES = ['United States', 'Japan', 'Brazil', 'France'];

const CITIES = {
  'United States': ['New York', 'San Francisco', 'Los Angeles'],
  Japan: ['Tokyo', 'Osaka', 'Kyoto'],
  Brazil: ['São Paulo', 'Rio de Janeiro'],
  France: ['Paris', 'Marseille'],
};

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

const currencyItemRenderer = (ctx) => {
  const root = document.createElement('div');
  root.className = 'currency-item';
  if (ctx.selected) root.classList.add('is-selected');
  if (ctx.focused) root.classList.add('is-focused');

  const symbol = document.createElement('span');
  symbol.className = 'currency-item__symbol';
  symbol.textContent = ctx.template.symbol;

  const code = document.createElement('span');
  code.className = 'currency-item__code';
  code.textContent = ctx.template.code;

  const name = document.createElement('span');
  name.className = 'currency-item__name';
  name.textContent = ctx.template.name;

  root.append(symbol, code, name);
  return root;
};

const formDef = [
  gui.inputs.dropdown('country', {
    label: 'Country',
    items: COUNTRIES,
    onChange: ({ data, update }) => {
      update({ path: 'city', options: CITIES[data.country] ?? [] });
    },
  }),
  gui.inputs.radiogroup('city', {
    label: 'City',
    options: [],
    include: { when: '!!$form.country' },
    onLoad: ({ data, update }) => {
      if (data.country) update({ path: 'city', options: CITIES[data.country] ?? [] });
    },
  }),
  gui.inputs.dropdown('currency', {
    label: 'Currency',
    items: CURRENCIES,
    labelField: 'code',
    valueField: 'code',
    itemRenderer: 'currencyItemRenderer',
    include: { when: '!!$form.city' },
  }),
  gui.inputs.checkbox('pets', {
    label: 'Travelling with pets?',
    include: { when: '!!$form.currency' },
  }),
  gui.inputs.datePicker('startDate', {
    label: 'Start date',
    icon: 'calendar_month',
    prevMonthIcon: 'chevron_left',
    nextMonthIcon: 'chevron_right',
    include: { when: '$form.pets != null' },
  }),
  gui.actions.button({
    label: 'Submit',
    uid: 'submit',
    onClick: 'handleSubmit',
  }),
];

const form = document.getElementById('app-form');
form.config = {
  formDef,
  formConfig: {
    validateOn: 'submit',
    itemRenderers: { currencyItemRenderer },
  },
};

form.addEventListener('formEvent', (event) => {
  if (event.detail.name === 'handleSubmit') {
    console.log('Submitted:', event.detail.data);
    alert(`Submitted:\n${JSON.stringify(event.detail.data, null, 2)}`);
  }
});
