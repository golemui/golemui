import type { WidgetLoaders, WithWidget } from '@golemui/core';
import type { GolemWidget } from '@golemui/gui-shared/internals';

export const widgetLoaders: WidgetLoaders<React.ComponentType<WithWidget>, GolemWidget> = {
  // INTERACTIVE
  button: async () => (await import('./components/Button')).Button,

  // CONTROLS
  calendar: async () => (await import('./components/Calendar')).Calendar,
  dateTimeCalendar: async () => (await import('./components/DateTimeCalendar')).DateTimeCalendar,
  currency: async () => (await import('./components/Currency')).Currency,
  dateInput: async () => (await import('./components/DateInput')).DateInput,
  datePicker: async () => (await import('./components/DatePicker')).DatePicker,
  dateTimePicker: async () => (await import('./components/DateTimePicker')).DateTimePicker,
  dropdown: async () => (await import('./components/Dropdown')).Dropdown,
  list: async () => (await import('./components/List')).List,
  password: async () => (await import('./components/Password')).Password,
  textinput: async () => (await import('./components/TextInput')).TextInput,
  timeInput: async () => (await import('./components/TimeInput')).TimeInput,
  timePicker: async () => (await import('./components/TimePicker')).TimePicker,
  dateTimeInput: async () => (await import('./components/DateTimeInput')).DateTimeInput,
  textarea: async () => (await import('./components/TextArea')).TextArea,
  markdown: async () => (await import('./components/Markdown')).Markdown,
  checkbox: async () => (await import('./components/Checkbox')).Checkbox,
  toggle: async () => (await import('./components/Toggle')).Toggle,
  number: async () => (await import('./components/Number')).NumberInput,
  select: async () => (await import('./components/Select')).Select,
  radiogroup: async () => (await import('./components/RadioGroup')).RadioGroup,
  rangeCalendar: async () => (await import('./components/RangeCalendar')).RangeCalendar,
  rangeDateInput: async () => (await import('./components/RangeDateInput')).RangeDateInput,
  rangeTimeInput: async () => (await import('./components/RangeTimeInput')).RangeTimeInput,
  rangeDatePicker: async () => (await import('./components/RangeDatePicker')).RangeDatePicker,
  tags: async () => (await import('./components/Tags')).Tags,

  // REPEATER
  repeater: async () => (await import('./components/Repeater')).Repeater,

  // LAYOUTS
  flex: async () => (await import('./components/Flex')).Flex,
  grid: async () => (await import('./components/Grid')).Grid,
  tabs: async () => (await import('./components/Tabs')).Tabs,
  accordion: async () => (await import('./components/Accordion')).Accordion,

  // DISPLAY
  alert: async () => (await import('./components/Alert')).Alert,
  markdownText: async () => (await import('./components/MarkdownText')).MarkdownText,
  renderer: async () => (await import('./components/Renderer')).Renderer,
};
