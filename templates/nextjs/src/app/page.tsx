'use client';

import type { FormEvent, ValidateOn } from '@golemui/core';
import { GuiForm, type ListItemRendererProps } from '@golemui/gui-react';
import { gui } from '@golemui/gui-shared';
import { type ReactItemRenderer } from '@golemui/react';

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

function CurrencyItemRenderer({
  template,
  selected,
  focused,
}: ListItemRendererProps<CurrencyItem>) {
  const classes = ['currency-item'];
  if (selected) classes.push('is-selected');
  if (focused) classes.push('is-focused');
  return (
    <div className={classes.join(' ')}>
      <span className="currency-item__symbol">{template?.symbol}</span>
      <span className="currency-item__code">{template?.code}</span>
      <span className="currency-item__name">{template?.name}</span>
    </div>
  );
}

const itemRenderers: Record<string, ReactItemRenderer<any>> = {
  currencyItemRenderer: CurrencyItemRenderer,
};

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

const config = {
  // The server and the client must produce the same ids. A fixed form name keeps the id
  // predictable in the markup.
  formName: 'signup',
  formDef,
  formConfig: {
    validateOn: 'submit' as ValidateOn,
    itemRenderers,
  },
};

function handleFormEvent(event: FormEvent) {
  if (event.name === 'handleSubmit') {
    console.log('Submitted:', event.data);
    alert(`Submitted:\n${JSON.stringify(event.data, null, 2)}`);
  }
}

export default function Page() {
  return (
    <>
      <h1>GolemUI Next.js Template</h1>
      <GuiForm config={config} formEvent={handleFormEvent} />
    </>
  );
}
