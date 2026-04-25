import { gui } from '@golemui/gui-shared';

export const selectTab = gui.layouts.flex([
  gui.inputs.select('selects.greeting', {
    label: 'Greeting',
    readonly: true,
    icon: 'phone_callback',
    hint: '"bye" should be selected',
    options: ['hello', 'bye'],
    placeholder: 'Please, select an option',
    autocomplete: 'off',
  }),
  gui.inputs.select('selects.wrongGreeting', {
    icon: 'phone_callback',
    hint: 'The disabled  "Select an Option" option should be selected, because the provided data does not match the enum of options. A validation error should also be displayed',
    options: ['hello', 'bye'],
    // TODO: validator on select — DX type gap, tracked in dx-open-items
  }),
  gui.inputs.select('selects.requiredUnselected', {
    hint: 'The disabled  "Select an Option" option should be selected, and a validation error should be displayed because the field is required',
    options: ['hello', 'bye'],
    // TODO: validator on select — DX type gap, tracked in dx-open-items
  }),
  gui.inputs.select('selects.greetingIndex', {
    hint: '"bye.2" should be selected',
    options: [
      { label: 'hello.1', value: 1 },
      { label: 'bye.2', value: 2 },
    ],
  }),
  gui.inputs.select('selects.subregion', {
    label: 'Country subregion',
    hint: 'The disabled  "Select an Option" option should be selected',
    onLoad: 'getSubregionsForSelect',
    onChange: 'getCountriesForSelect',
  }),
  gui.inputs.select('selects.country', {
    include: { in: ['hasSubregionSelect'] },
  }),
]);
