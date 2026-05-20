import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { type AngularItemRenderer } from '@golemui/angular';
import type { FormEvent, ValidateOn } from '@golemui/core';
import { FormComponent } from '@golemui/gui-angular';
import { gui, type GuiFormInitConfig } from '@golemui/gui-shared';
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
    onClick: 'handleSubmit',
  }),
];

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
    formConfig: {
      validateOn: 'submit' as ValidateOn,
      itemRenderers: {
        currencyItemRenderer: CurrencyItemRenderer,
      } as Record<string, AngularItemRenderer<any>>,
    },
  };

  protected onFormEvent(event: FormEvent) {
    if (event.name === 'handleSubmit') {
      console.log('Submitted:', event.data);
      alert(`Submitted:\n${JSON.stringify(event.data, null, 2)}`);
    }
  }
}
