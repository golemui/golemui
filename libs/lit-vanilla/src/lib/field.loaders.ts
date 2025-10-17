import { TextinputElement } from './components/textinput.element';

export const vanillaFieldLoaders = {
  // // BUTTON
  // button: async () => (await import('./components/Button')).Button,
  //
  // // CONTROLS
  textinput: async () =>
    (await import('./components/textinput.element')).TextinputElement,
  // checkbox: async () => (await import('./components/Checkbox')).Checkbox,
  //
  // // REPEATER
  // repeater: async () => (await import('./components/Repeater')).Repeater,
  // LAYOUTS
  stack: async () => (await import('./components/stack.element')).StackElement,
  // tabs: async () => (await import('./components/Tabs')).Tabs,
  // accordion: async () => (await import('./components/Accordion')).Accordion,
  //
  // // FIELDS
  // alert: async () => (await import('./components/Alert')).Alert,
};
