export const controlWidgets = [
  'calendar',
  'dateInput',
  'datePicker',
  'textinput',
  'textarea',
  'toggle',
  'checkbox',
  'number',
  'select',
  'radiogroup',
  'repeater',
] as const;
export const layoutWidgets = ['stack', 'tabs', 'accordion'] as const;
export const displayWidgets = ['alert'] as const;
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
