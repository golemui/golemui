import type { ItemRenderContext } from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import { html, type TemplateResult } from 'lit';

// Imported by the page frontmatter (server render) and by the page script (client resume),
// so both sides build the form from the same definition. Nothing here touches the DOM.

export type FormShape = {
  country?: string;
  city?: string;
  currency?: string;
  pets?: boolean;
  startDate?: string;
};

type CurrencyItem = { code: string; symbol: string; name: string };

const COUNTRIES = ['United States', 'Japan', 'Brazil', 'France'];

export const CITIES: Record<string, string[]> = {
  'United States': ['New York', 'San Francisco', 'Los Angeles'],
  Japan: ['Tokyo', 'Osaka', 'Kyoto'],
  Brazil: ['São Paulo', 'Rio de Janeiro'],
  France: ['Paris', 'Marseille'],
};

const CURRENCIES: CurrencyItem[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

const currencyItemRenderer = (ctx: ItemRenderContext<CurrencyItem>): TemplateResult => html`
  <div
    class="currency-item ${ctx.selected ? 'is-selected' : ''} ${ctx.focused ? 'is-focused' : ''}"
  >
    <span class="currency-item__symbol">${ctx.template.symbol}</span>
    <span class="currency-item__code">${ctx.template.code}</span>
    <span class="currency-item__name">${ctx.template.name}</span>
  </div>
`;

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
      // The `load` event runs in the browser once the widget has mounted, never during the
      // server render.
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

export const config: GuiFormInitConfig = {
  // Server rendering requires an explicit formName: it is what makes the server and the
  // client produce the same form id.
  formName: 'signup',
  formDef,
  validateOn: 'submit',
  itemRenderers: { currencyItemRenderer },
};
