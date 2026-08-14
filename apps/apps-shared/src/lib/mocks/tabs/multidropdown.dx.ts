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

export const multiDropdownTab = gui.layouts.flex([
  gui.inputs.multiDropdown('multiDropdowns.frameworks', {
    label: 'Frameworks',
    placeholder: 'Search frameworks…',
    hint: 'Toggle options — the panel stays open while you pick',
    inputDebounce: 0,
    items: frameworks,
  }),
  gui.inputs.multiDropdown('multiDropdowns.objectItems', {
    label: 'Object items',
    placeholder: 'Search items…',
    hint: 'Object items resolved through labelField/valueField',
    height: 150,
    items: objectItems,
  }),
  gui.inputs.multiDropdown('multiDropdowns.limited', {
    label: 'Limited to 3 selections',
    placeholder: 'Pick up to three…',
    hint: 'The fourth toggle is ignored',
    limit: 3,
    items: frameworks,
  }),
  gui.inputs.multiDropdown('multiDropdowns.disabled', {
    label: 'Disabled multi dropdown',
    placeholder: 'Disabled',
    disabled: true,
    readonly: true,
    items: frameworks,
  }),
  gui.inputs.multiDropdown('multiDropdowns.required', {
    label: 'Required multi dropdown',
    placeholder: 'Pick at least two…',
    hint: 'Select at least two frameworks',
    items: frameworks,
    validator: { type: 'array', required: true, minItems: 2 },
  }),
]);
