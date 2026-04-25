import { gui } from '@golemui/gui-shared';

export const radiogroupTab = gui.layouts.flex([
  gui.inputs.radiogroup('radiogroups.greeting', {
    label: 'Greeting',
    readonly: true,
    hint: 'This radiogroup is disabled and "bye" should be selected',
    options: ['hello', 'bye'],
  }),
  gui.inputs.radiogroup('radiogroups.wrongGreeting', {
    hint: 'No option should be selected, because the provided data does not match the enum of options. A validation error should also be displayed',
    options: ['hello', 'bye'],
    // TODO: validator on radiogroup — DX type gap, tracked in dx-open-items
  }),
  gui.inputs.radiogroup('radiogroups.requiredUnselected', {
    hint: 'No option should be selected, and a validation error should be displayed because the field is required',
    options: ['hello', 'bye'],
    direction: 'row',
    // TODO: validator on radiogroup — DX type gap, tracked in dx-open-items
  }),
  gui.inputs.radiogroup('radiogroups.greetingIndex', {
    hint: '"bye.2" should be selected',
    options: [
      { label: 'hello.1', value: 1 },
      { label: 'bye.2', value: 2 },
    ],
  }),
  gui.inputs.radiogroup('radiogroups.subregion', {
    label: 'Country subregion',
    hint: 'No option should be selected',
    onLoad: 'getSubregionsForRadio',
    onChange: 'getCountriesForRadio',
  }),
  gui.inputs.radiogroup('radiogroups.country', {
    include: { in: ['hasSubregionRadiogroup'] },
  }),
]);
