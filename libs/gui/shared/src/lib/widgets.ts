export const inputWidgets = [
  'calendar',
  'checkbox',
  'currency',
  'dateInput',
  'datePicker',
  'dropdown',
  'list',
  'markdown',
  'number',
  'password',
  'radiogroup',
  'rangeCalendar',
  'rangeDateInput',
  'rangeDatePicker',
  'repeater',
  'select',
  'textarea',
  'textinput',
  'toggle',
] as const;
export const layoutWidgets = ['accordion', 'flex', 'tabs'] as const;
export const displayWidgets = ['alert', 'renderer'] as const;
export const actionWidgets = ['button'] as const;

// TODO: rename to golem (search other vanilla named things accross the repo)
export const vanillaWidgets = [
  ...inputWidgets,
  ...layoutWidgets,
  ...displayWidgets,
  ...actionWidgets,
];

export type VanillaInputWidget = (typeof inputWidgets)[number];
export type VanillaLayoutWidget = (typeof layoutWidgets)[number];
export type VanillaDisplayWidget = (typeof displayWidgets)[number];
export type VanillaActionWidget = (typeof actionWidgets)[number];

export type VanillaWidget = (typeof vanillaWidgets)[number];
