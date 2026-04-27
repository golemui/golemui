export const FORM_SOURCE = `import { defineForm, FunctionWidgetParams } from '@golemui/core';
import { countries, currencyByCountry, languages } from './customData';

const COUNTRIES = countries;
const CURRENCY_BY_COUNTRY: Record<string, string> = currencyByCountry;
const LANGUAGES = languages;

// Earliest selectable date — today
const minDate = new Date().toISOString().split('T')[0];

export const travelPlannerForm = defineForm({
  form: [
    // Language switcher — emits 'onSelectLanguage' which the host swaps via i18next
    gui.inputs.dropdown('language', {
      uid: 'language',
      label: { key: 'travelPlanner.field.language.label', default: 'Language' },
      defaultValue: 'en',
      props: { items: LANGUAGES, labelField: 'label', valueField: 'id' },
      validator: { type: 'string', required: true },
      on: { change: 'onSelectLanguage' },
    }),

    // Departure country + budget on one row
    {
      kind: 'layout', type: 'grid', uid: '',
      props: { direction: 'row', autoFit: true, align: 'stretch' },
      children: [
        {
          uid: 'departureCountry',
          kind: 'input',
          type: 'dropdown',
          path: 'departureCountry',
          label: { key: 'travelPlanner.field.departureCountry.label', default: 'Departure Country' },
          props: {
            items: COUNTRIES,
            labelField: 'label',
            valueField: 'id',
            itemRenderer: 'countryItemRenderer', // custom renderer with flag + label
          },
          validator: { type: 'string', required: true },
          on: { change: 'fieldChange' },
        },
        {
          uid: 'budget',
          kind: 'input',
          type: 'currency',
          path: 'budget',
          label: { key: 'travelPlanner.field.budget.label', default: 'Travel Budget' },
          props: {
            step: 100,
            // Reactive props — re-evaluated whenever \`$form.departureCountry\` changes
            placeholder: (data: FunctionWidgetParams<any> | undefined) =>
              CURRENCY_BY_COUNTRY[data?.$form?.departureCountry ?? 'US'],
            currency: (data: FunctionWidgetParams<any> | undefined) =>
              CURRENCY_BY_COUNTRY[data?.$form?.departureCountry ?? 'US'],
          },
          validator: { type: 'number', required: true, minimum: 100 },
          on: { change: 'fieldChange' },
        },
      ],
    },

    // Passengers + (conditionally) pets
    {
      kind: 'layout', type: 'grid', uid: '',
      props: { direction: 'row', autoFit: true, align: 'end' },
      children: [
        {
          uid: 'passengers',
          kind: 'input',
          type: 'number',
          path: 'passengers',
          defaultValue: 1,
          label: { key: 'travelPlanner.field.passengers.label', default: 'Passengers' },
          props: { minimum: 1, maximum: 10 },
          validator: { type: 'number', required: true, minimum: 1, maximum: 10 },
        },
        {
          uid: 'pets',
          kind: 'input',
          type: 'number',
          path: 'pets',
          defaultValue: 1,
          label: { key: 'travelPlanner.field.pets.label', default: 'Pets' },
          props: { minimum: 1, maximum: 3 },
          validator: { type: 'number', required: true, minimum: 1, maximum: 3 },
          // Conditional rendering — only included when the toggle below is on
          include: { when: '$form.includePets === true' },
        },
      ],
    },

    // Toggle that gates the pets field
    {
      kind: 'layout', type: 'flex', uid: '',
      props: { direction: 'column', align: 'end' },
      children: [
        {
          uid: 'includePets',
          kind: 'input',
          type: 'toggle',
          path: 'includePets',
          label: { key: 'travelPlanner.field.includePets', default: 'Include Pets' },
          on: { change: 'fieldChange' },
        },
      ],
    },

    // Date range picker — declarative \`maxItems\` produces the live validation error
    {
      uid: 'preferredDates',
      kind: 'input',
      type: 'rangeCalendar',
      path: 'preferredDates',
      label: { key: 'travelPlanner.field.preferredDates.label', default: 'Select Preferred Dates' },
      props: { minDate, icon: 'calendar_month' },
      validator: {
        type: 'array',
        required: true,
        minItems: 1,
        maxItems: 3,
        messages: {
          maxItems: { key: 'travelPlanner.field.preferredDates.maxItems', default: 'Pick at most three dates' },
        },
      },
      on: { change: 'fieldChange' },
    },

    // Submit — fires 'handleSubmit' which the host listens for
    {
      uid: 'btn-submit',
      kind: 'action',
      type: 'button',
      label: { key: 'travelPlanner.btn.submit', default: 'Search My Trip' },
      on: { click: 'handleSubmit' },
    },
  ],
});
`;
