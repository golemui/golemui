import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import type { FormEvent } from '@golemui/core';
import { FormComponent } from '@golemui/gui-angular';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import { CurrencyItemRenderer, type CurrencyItem } from './currency-item-renderer.component';

type FormShape = {
  country?: string;
  city?: string;
  currency?: string;
  pets?: boolean;
  startDate?: string;
};

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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormComponent],
  templateUrl: './app.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class App {
  protected config: GuiFormInitConfig = {
    formDef,
    validateOn: 'submit',
    itemRenderers: {
      currencyItemRenderer: CurrencyItemRenderer,
    },
  };

  protected onFormEvent(event: FormEvent) {
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
}
