import * as Core from '@golemui/core';
import { VanillaWidget } from '@golemui/shared-vanilla';
import { Type } from './utils/types';

export const vanillaFieldLoaders: Core.FieldLoaders<Type<Core.WithField>, VanillaWidget> = {
  // INTERACTIVE
  button: async () => (await import('./components/button.element')).ButtonElement,

  // CONTROLS
  textinput: async () => (await import('./components/textinput.element')).TextinputElement,
  textarea: async () => (await import('./components/textarea.element')).TextareaElement,
  toggle: async () => (await import('./components/toggle.element')).ToggleElement,
  checkbox: async () => (await import('./components/checkbox.element')).CheckboxElement,
  number: async () => (await import('./components/number.element')).NumberElement,
  radiogroup: async () => (await import('./components/radiogroup.element')).RadiogroupElement,
  select: async () => (await import('./components/select.element')).SelectElement,

  // REPEATER
  repeater: async () => (await import('./components/repeater.element')).RepeaterElement,

  // LAYOUTS
  stack: async () => (await import('./components/stack.element')).StackElement,
  tabs: async () => (await import('./components/tabs.element')).TabsElement,
  accordion: async () => (await import('./components/accordion.element')).AccordionElement,

  // DISPLAY
  alert: async () => (await import('./components/alert.element')).AlertElement,
};
