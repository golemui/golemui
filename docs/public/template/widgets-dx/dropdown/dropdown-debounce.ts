import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.dropdown('fruit', {
    items: [
      'Apple',
      'Apricot',
      'Banana',
      'Blueberry',
      'Cherry',
      'Grapefruit',
      'Mango',
      'Orange',
      'Peach',
      'Pineapple',
    ],
    hint: 'Filtering waits 800ms after the last keystroke',
    inputDebounce: 800,
    label: 'Pick a fruit',
    uid: 'dropdown_debounce',
  }),
];
