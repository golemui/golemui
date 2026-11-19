'use client';

import type { FormEvent } from '@golemui/core';
import { GuiForm, type ListItemRendererProps } from '@golemui/gui-react';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
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

const config: GuiFormInitConfig = {
  // The server and the client must produce the same ids. A fixed form name keeps the id
  // predictable in the markup.
  formName: 'signup',
  formDef,
  validateOn: 'submit',
  itemRenderers,
};

function handleFormEvent(event: FormEvent) {
  if (event.name === 'loadCities') {
    const country = (event.data as FormShape).country;
    event.callback({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: { path: 'city', prop: 'options', value: CITIES[country ?? ''] ?? [] },
    });
  }
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
