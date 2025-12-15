export const controlWidgets = [
  'textinput',
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

export type VanillaWidget = (typeof vanillaWidgets)[number];
