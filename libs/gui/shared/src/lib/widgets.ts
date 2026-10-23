export const inputWidgets = [
  'calendar',
  'dateTimeCalendar',
  'checkbox',
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
  'rangeCalendar',
  'rangeDateInput',
  'rangeDatePicker',
  'rangeDateTimeInput',
  'rangeDateTimeCalendar',
  'rangeDateTimePicker',
  'rangeSlider',
  'rangeTimeInput',
  'rangeTimePicker',
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
export const layoutWidgets = ['accordion', 'flex', 'grid', 'tabs'] as const;
export const displayWidgets = ['alert', 'markdownText', 'renderer'] as const;
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
