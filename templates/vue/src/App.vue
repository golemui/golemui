<script setup lang="ts">
import type { FormEvent } from '@golemui/core';
import { GuiForm } from '@golemui/gui-vue';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import type { VueItemRenderer } from '@golemui/vue';
import CurrencyItemRenderer from './CurrencyItemRenderer.vue';

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

const config: GuiFormInitConfig = {
  formDef,
  validateOn: 'submit',
  itemRenderers: {
    currencyItemRenderer: CurrencyItemRenderer,
  } as Record<string, VueItemRenderer<any>>,
};

function onFormEvent(event: FormEvent) {
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
</script>

<template>
  <h1>GolemUI Vue Template</h1>
  <GuiForm :config="config" @formEvent="onFormEvent" />
</template>
