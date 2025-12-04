export const vanillaFieldLoaders = {
  // // BUTTON
  button: async () => (await import('./components/button.element')).ButtonElement,
  //
  // // CONTROLS
  textinput: async () => (await import('./components/textinput.element')).TextinputElement,
  checkbox: async () => (await import('./components/checkbox.element')).CheckboxElement,
  number: async () => (await import('./components/number.element')).NumberElement,
  select: async () => (await import('./components/select.element')).SelectElement,
  //
  // // REPEATER
  repeater: async () => (await import('./components/repeater.element')).RepeaterElement,
  // LAYOUTS
  stack: async () => (await import('./components/stack.element')).StackElement,
  tabs: async () => (await import('./components/tabs.element')).TabsElement,
  accordion: async () => (await import('./components/accordion.element')).AccordionElement,
  //
  // // FIELDS
  alert: async () => (await import('./components/alert.element')).AlertElement,
};
