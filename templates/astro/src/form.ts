import type { ItemRenderContext, ValidateOn } from '@golemui/core';
import { gui, type GuiFormInitConfig } from '@golemui/gui-shared';
import { html, type TemplateResult } from 'lit';

// Imported by the page frontmatter (server render) and by the page script (client resume),
// so both sides build the form from the same definition. Nothing here touches the DOM.

type FormShape = {
  country?: string;
  city?: string;
  currency?: string;
  pets?: boolean;
  startDate?: string;
};

type CurrencyItem = { code: string; symbol: string; name: string };

const COUNTRIES = ['United States', 'Japan', 'Brazil', 'France'];

const CITIES: Record<string, string[]> = {
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

const formDef = [
  gui.inputs.dropdown('country', {
    label: 'Country',
    items: COUNTRIES,
    onChange: ({ data, update }) => {
      const country = (data as FormShape).country;
      update({ path: 'city', options: CITIES[country ?? ''] ?? [] });
    },
  }),
  gui.inputs.radiogroup('city', {
    label: 'City',
    options: [],
    include: { when: '!!$form.country' },
    // `onLoad` runs in the browser once the widget has mounted, never during the server render.
    onLoad: ({ data, update }) => {
      const country = (data as FormShape).country;
      if (country) update({ path: 'city', options: CITIES[country] ?? [] });
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
    onClick: () => 'handleSubmit',
  }),
];

export const config: GuiFormInitConfig = {
  // Server rendering requires an explicit formName: it is what makes the server and the
  // client produce the same form id.
  formName: 'signup',
  formDef,
  formConfig: {
    validateOn: 'submit' as ValidateOn,
    itemRenderers: { currencyItemRenderer },
  },
};
