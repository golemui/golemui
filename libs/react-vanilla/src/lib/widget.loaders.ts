import * as Core from '@golemui/core';
import { VanillaWidget } from '@golemui/shared-vanilla';

export const vanillaWidgetLoaders: Core.WidgetLoaders<
  React.ComponentType<Core.WithWidget>,
  VanillaWidget
> = {
  // INTERACTIVE
  button: async () => (await import('./components/Button')).Button,

  // CONTROLS
  calendar: async () => (await import('./components/Calendar')).Calendar,
  currency: async () => (await import('./components/Currency')).Currency,
  dateInput: async () => (await import('./components/DateInput')).DateInput,
  datePicker: async () => (await import('./components/DatePicker')).DatePicker,
  dropdown: async () => (await import('./components/Dropdown')).Dropdown,
  list: async () => (await import('./components/List')).List,
  textinput: async () => (await import('./components/TextInput')).TextInput,
  textarea: async () => (await import('./components/TextArea')).TextArea,
  checkbox: async () => (await import('./components/Checkbox')).Checkbox,
  toggle: async () => (await import('./components/Toggle')).Toggle,
  number: async () => (await import('./components/Number')).NumberInput,
  select: async () => (await import('./components/Select')).Select,
  radiogroup: async () => (await import('./components/RadioGroup')).RadioGroup,
  rangeCalendar: async () => (await import('./components/RangeCalendar')).RangeCalendar,

  // REPEATER
  repeater: async () => (await import('./components/Repeater')).Repeater,

  // LAYOUTS
  stack: async () => (await import('./components/Stack')).Stack,
  tabs: async () => (await import('./components/Tabs')).Tabs,
  accordion: async () => (await import('./components/Accordion')).Accordion,

  // DISPLAY
  alert: async () => (await import('./components/Alert')).Alert,
  renderer: async () => (await import('./components/Renderer')).Renderer,
};
