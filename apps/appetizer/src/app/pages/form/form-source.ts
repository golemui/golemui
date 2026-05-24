export const FORM_SOURCE = `import type { FunctionWidgetParams } from '@golemui/core';
import { gui } from '@golemui/gui-shared';
import { countries, currencyByCountry, languages } from './customData';

const COUNTRIES = countries;
const CURRENCY_BY_COUNTRY: Record<string, string> = currencyByCountry;
const LANGUAGES = languages;

// Earliest selectable date — today
const minDate = new Date().toISOString().split('T')[0];

export const travelPlannerForm = [
  // Language switcher — emits 'onSelectLanguage' which the host swaps via i18next
  gui.inputs.dropdown('language', {
    uid: 'language',
    label: { key: 'travelPlanner.field.language.label', default: 'Language' },
    defaultValue: 'en',
    props: { items: LANGUAGES, labelField: 'label', valueField: 'id' },
    validator: { type: 'string', required: true },
    onChange: 'onSelectLanguage',
  }),

  // Departure country + budget on one row
  gui.layouts.grid(
    [
      gui.inputs.dropdown('departureCountry', {
        label: { key: 'travelPlanner.field.departureCountry.label', default: 'Departure Country' },
        props: {
          items: COUNTRIES,
          labelField: 'label',
          valueField: 'id',
          itemRenderer: 'countryItemRenderer', // custom renderer with flag + label
        },
        validator: { type: 'string', required: true },
        onChange: 'fieldChange',
      }),
      gui.inputs.currency('budget', {
        label: { key: 'travelPlanner.field.budget.label', default: 'Travel Budget' },
        step: 100,
        // Reactive props — re-evaluated whenever \`$form.departureCountry\` changes
        placeholder: (data: FunctionWidgetParams<any> | undefined) =>
          CURRENCY_BY_COUNTRY[data?.$form?.departureCountry ?? 'US'],
        currency: (data: FunctionWidgetParams<any> | undefined) =>
          CURRENCY_BY_COUNTRY[data?.$form?.departureCountry ?? 'US'],
        validator: { required: true, minimum: 100 },
        onChange: 'fieldChange',
      }),
    ],
    { direction: 'row', autoFit: true, align: 'stretch' },
  ),

  // Passengers + (conditionally) pets
  gui.layouts.grid(
    [
      gui.inputs.numberInput('passengers', {
        defaultValue: 1,
        label: { key: 'travelPlanner.field.passengers.label', default: 'Passengers' },
        minimum: 1,
        maximum: 10,
        validator: { required: true, minimum: 1, maximum: 10 },
      }),
      gui.inputs.numberInput('pets', {
        defaultValue: 1,
        label: { key: 'travelPlanner.field.pets.label', default: 'Pets' },
        minimum: 1,
        maximum: 3,
        validator: { required: true, minimum: 1, maximum: 3 },
        // Conditional rendering — only included when the toggle below is on
        include: { when: '$form.includePets === true' },
      }),
    ],
    { direction: 'row', autoFit: true, align: 'end' },
  ),

  // Toggle that gates the pets field
  gui.layouts.flex(
    [
      gui.inputs.booleanInput('includePets', {
        label: { key: 'travelPlanner.field.includePets', default: 'Include Pets' },
        onChange: 'fieldChange',
      }),
    ],
    { direction: 'column', align: 'end' },
  ),

  // Date range picker — declarative \`maxItems\` produces the live validation error
  gui.inputs.rangeCalendar('preferredDates', {
    label: { key: 'travelPlanner.field.preferredDates.label', default: 'Select Preferred Dates' },
    minDate,
    icon: 'calendar_month',
    validator: {
      required: true,
      minItems: 1,
      maxItems: 3,
      messages: {
        maxItems: { key: 'travelPlanner.field.preferredDates.maxItems', default: 'Pick at most three dates' },
      },
    },
    onChange: 'fieldChange',
  }),

  // Submit — fires 'handleSubmit' which the host listens for
  gui.actions.button({
    uid: 'btn-submit',
    label: { key: 'travelPlanner.btn.submit', default: 'Search My Trip' },
    onClick: () => 'handleSubmit',
  }),
];
`;
