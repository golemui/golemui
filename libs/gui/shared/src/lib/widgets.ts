export const inputWidgets = [
  'calendar',
  'dateTimeCalendar',
  'checkbox',
  'checkboxGroup',
  'currency',
  'dateInput',
  'datePicker',
  'dateTimeInput',
  'dateTimePicker',
  'dropdown',
  'fileUpload',
  'list',
  'markdown',
  'multiDropdown',
  'multiFileUpload',
  'multiList',
  'number',
  'otp',
  'password',
  'radiogroup',
  'multiRangeCalendar',
  'multiRangeDateInput',
  'multiRangeDatePicker',
  'multiRangeDateTimeInput',
  'multiRangeDateTimeCalendar',
  'multiRangeDateTimePicker',
  'rangeCalendar',
  'rangeDateInput',
  'rangeDatePicker',
  'rangeDateTimeInput',
  'rangeDateTimeCalendar',
  'rangeDateTimePicker',
  'rangeSlider',
  'rangeTimeInput',
  'rangeTimePicker',
  'multiRangeTimeInput',
  'multiRangeTimePicker',
  'rating',
  'repeater',
  'select',
  'slider',
  'tags',
  'textarea',
  'textinput',
  'timeInput',
  'timePicker',
  'toggle',
] as const;
export const layoutWidgets = ['accordion', 'grid', 'tabs'] as const;
export const displayWidgets = [
  'alert',
  'badge',
  'image',
  'markdownText',
  'progress',
  'spinner',
  'typography',
] as const;
export const actionWidgets = ['button', 'menu'] as const;

export const golemWidgets = [
  ...inputWidgets,
  ...layoutWidgets,
  ...displayWidgets,
  ...actionWidgets,
];

export type GolemInputWidget = (typeof inputWidgets)[number];
export type GolemLayoutWidget = (typeof layoutWidgets)[number];
export type GolemDisplayWidget = (typeof displayWidgets)[number];
export type GolemActionWidget = (typeof actionWidgets)[number];

export type GolemWidget = (typeof golemWidgets)[number];
