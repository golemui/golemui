import type { WidgetLoaders, WithWidget } from '@golemui/core';
import type { GolemWidget } from '@golemui/gui-shared/internals';
import type { Component } from 'vue';

export const widgetLoaders: WidgetLoaders<Component<WithWidget>, GolemWidget> = {
  // INTERACTIVE
  button: async () => (await import('./components/Button.vue')).default,

  // CONTROLS
  calendar: async () => (await import('./components/Calendar.vue')).default,
  dateTimeCalendar: async () => (await import('./components/DateTimeCalendar.vue')).default,
  currency: async () => (await import('./components/Currency.vue')).default,
  dateInput: async () => (await import('./components/DateInput.vue')).default,
  datePicker: async () => (await import('./components/DatePicker.vue')).default,
  dropdown: async () => (await import('./components/Dropdown.vue')).default,
  list: async () => (await import('./components/List.vue')).default,
  password: async () => (await import('./components/Password.vue')).default,
  textinput: async () => (await import('./components/TextInput.vue')).default,
  timeInput: async () => (await import('./components/TimeInput.vue')).default,
  timePicker: async () => (await import('./components/TimePicker.vue')).default,
  dateTimeInput: async () => (await import('./components/DateTimeInput.vue')).default,
  textarea: async () => (await import('./components/TextArea.vue')).default,
  markdown: async () => (await import('./components/Markdown.vue')).default,
  checkbox: async () => (await import('./components/Checkbox.vue')).default,
  toggle: async () => (await import('./components/Toggle.vue')).default,
  number: async () => (await import('./components/NumberInput.vue')).default,
  select: async () => (await import('./components/Select.vue')).default,
  radiogroup: async () => (await import('./components/RadioGroup.vue')).default,
  rangeCalendar: async () => (await import('./components/RangeCalendar.vue')).default,
  rangeDateInput: async () => (await import('./components/RangeDateInput.vue')).default,
  rangeDatePicker: async () => (await import('./components/RangeDatePicker.vue')).default,
  tags: async () => (await import('./components/Tags.vue')).default,

  // REPEATER
  repeater: async () => (await import('./components/Repeater.vue')).default,

  // LAYOUTS
  flex: async () => (await import('./components/Flex.vue')).default,
  grid: async () => (await import('./components/Grid.vue')).default,
  tabs: async () => (await import('./components/Tabs.vue')).default,
  accordion: async () => (await import('./components/Accordion.vue')).default,

  // DISPLAY
  alert: async () => (await import('./components/Alert.vue')).default,
  markdownText: async () => (await import('./components/MarkdownText.vue')).default,
  renderer: async () => (await import('./components/Renderer.vue')).default,
};
