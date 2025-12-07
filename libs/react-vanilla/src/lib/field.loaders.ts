import * as Core from '@golemui/core';

export const vanillaFieldLoaders: Core.FieldLoaders<React.ComponentType<Core.WithField>> = {
  // BUTTON
  button: async () => (await import('./components/Button')).Button,

  // CONTROLS
  textinput: async () => (await import('./components/TextInput')).TextInput,
  checkbox: async () => (await import('./components/Checkbox')).Checkbox,
  select: async () => (await import('./components/Select')).Select,
  number: async () => (await import('./components/Number')).NumberInput,

  // REPEATER
  repeater: async () => (await import('./components/Repeater')).Repeater,

  // LAYOUTS
  stack: async () => (await import('./components/Stack')).Stack,
  tabs: async () => (await import('./components/Tabs')).Tabs,
  accordion: async () => (await import('./components/Accordion')).Accordion,

  // FIELDS
  alert: async () => (await import('./components/Alert')).Alert,
};
