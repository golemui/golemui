import '@golemui/gui-components/index.css';
import '@golemui/gui-shared/forms.css';
import '@golemui/gui-lit';
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

const formDef = {
  form: [
    {
      kind: 'input',
      type: 'dropdown',
      path: 'country',
      label: 'Country',
      on: { change: 'loadCities' },
      props: { items: COUNTRIES, placeholder: 'country' },
    },
    {
      kind: 'input',
      type: 'radiogroup',
      path: 'city',
      label: 'City',
      include: { when: '!!$form.country' },
      on: { load: 'loadCities' },
      props: { options: [] },
    },
    {
      kind: 'input',
      type: 'dropdown',
      path: 'currency',
      label: 'Currency',
      include: { when: '!!$form.city' },
      props: {
        items: CURRENCIES,
        labelField: 'code',
        valueField: 'code',
        itemRenderer: 'currencyItemRenderer',
        placeholder: 'currency',
      },
    },
    {
      kind: 'input',
      type: 'checkbox',
      path: 'pets',
      label: 'Travelling with pets?',
      include: { when: '!!$form.currency' },
    },
    {
      kind: 'input',
      type: 'datePicker',
      path: 'startDate',
      label: 'Start date',
      include: { when: '$form.pets != null' },
      props: {
        icon: 'calendar_month',
        prevMonthIcon: 'chevron_left',
        nextMonthIcon: 'chevron_right',
      },
    },
    {
      kind: 'action',
      type: 'button',
      uid: 'submit',
      label: 'Submit',
      on: { click: 'handleSubmit' },
    },
  ],
};

const form = document.getElementById('app-form');
form.config = {
  formDef,
  validateOn: 'submit',
  itemRenderers: { currencyItemRenderer },
};

form.addEventListener('formEvent', (event) => {
  if (event.detail.name === 'loadCities') {
    const country = event.detail.data.country;
    event.detail.callback({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: { path: 'city', prop: 'options', value: CITIES[country ?? ''] ?? [] },
    });
  }
  if (event.detail.name === 'handleSubmit') {
    console.log('Submitted:', event.detail.data);
    alert(`Submitted:\n${JSON.stringify(event.detail.data, null, 2)}`);
  }
});
