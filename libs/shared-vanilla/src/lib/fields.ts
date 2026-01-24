export const controlWidgets = [
  'calendar',
  'checkbox',
  'currency',
  'dateInput',
  'datePicker',
  'dropdown',
  'list',
  'number',
  'radiogroup',
  'repeater',
  'select',
  'textarea',
  'textinput',
  'toggle',
] as const;
export const layoutWidgets = ['accordion', 'stack', 'tabs'] as const;
export const displayWidgets = ['alert', 'renderer'] as const;
export const interactiveWidgets = ['button'] as const;

export const vanillaWidgets = [
  ...controlWidgets,
  ...layoutWidgets,
  ...displayWidgets,
  ...interactiveWidgets,
];

export type VanillaControlWidget = (typeof controlWidgets)[number];
export type VanillaLayoutWidget = (typeof layoutWidgets)[number];
export type VanillaDisplayWidget = (typeof displayWidgets)[number];
export type VanillaInteractiveWidget = (typeof interactiveWidgets)[number];

export type VanillaWidget = (typeof vanillaWidgets)[number];
