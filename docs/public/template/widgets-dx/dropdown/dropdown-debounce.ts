import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.dropdown('fruit', {
    items: [
      { template: 'Apple', value: 'apple' },
      { template: 'Apricot', value: 'apricot' },
      { template: 'Banana', value: 'banana' },
      { template: 'Blueberry', value: 'blueberry' },
      { template: 'Cherry', value: 'cherry' },
      { template: 'Grapefruit', value: 'grapefruit' },
      { template: 'Mango', value: 'mango' },
      { template: 'Orange', value: 'orange' },
      { template: 'Peach', value: 'peach' },
      { template: 'Pineapple', value: 'pineapple' },
    ],
    hint: 'Filtering waits 800ms after the last keystroke',
    inputDebounce: 800,
    label: 'Pick a fruit',
    uid: 'dropdown_debounce',
  }),
];
