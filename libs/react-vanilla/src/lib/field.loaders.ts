import * as Core from '@golemui/core';
import { VanillaWidget } from '@golemui/shared-vanilla';

export const vanillaFieldLoaders: Core.FieldLoaders<
  React.ComponentType<Core.WithField>,
  VanillaWidget
> = {
  // INTERACTIVE
  button: async () => (await import('./components/Button')).Button,

  // CONTROLS
  textinput: async () => (await import('./components/TextInput')).TextInput,
  checkbox: async () => (await import('./components/Checkbox')).Checkbox,
  toggle: async () => (await import('./components/Toggle')).Toggle,
  number: async () => (await import('./components/Number')).NumberInput,
  select: async () => (await import('./components/Select')).Select,
  radiogroup: async () => (await import('./components/RadioGroup')).RadioGroup,

  // REPEATER
  repeater: async () => (await import('./components/Repeater')).Repeater,

  // LAYOUTS
  stack: async () => (await import('./components/Stack')).Stack,
  tabs: async () => (await import('./components/Tabs')).Tabs,
  accordion: async () => (await import('./components/Accordion')).Accordion,

  // DISPLAY
  alert: async () => (await import('./components/Alert')).Alert,
};
