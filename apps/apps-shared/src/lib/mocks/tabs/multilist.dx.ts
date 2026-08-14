import { gui } from '@golemui/gui-shared';

const frameworks = ['React', 'Angular', 'Vue', 'Lit', 'Svelte', 'Solid'];
const objectItems = [
  { label: 'Item 0', value: 0 },
  { label: 'Item 1', value: 1 },
  { label: 'Item 2', value: 2 },
  { label: 'Item 3', value: 3 },
  { label: 'Item 4', value: 4 },
  { label: 'Item 5', value: 5 },
];

export const multiListTab = gui.layouts.flex([
  gui.inputs.multiList('multiLists.frameworks', {
    label: 'Frameworks',
    hint: 'Click or press Enter/Space to toggle options on and off',
    height: 150,
    items: frameworks,
  }),
  gui.inputs.multiList('multiLists.objectItems', {
    label: 'Object items',
    hint: 'Object items resolved through labelField/valueField',
    height: 150,
    items: objectItems,
    validator: { type: 'array', required: true, minItems: 2 },
  }),
  gui.inputs.multiList('multiLists.limited', {
    label: 'Limited to 2 selections',
    hint: 'The third toggle is ignored',
    height: 150,
    limit: 2,
    items: frameworks,
  }),
  gui.inputs.multiList('multiLists.disabled', {
    label: 'Disabled multi list',
    disabled: true,
    readonly: true,
    height: 150,
    items: frameworks,
  }),
]);
