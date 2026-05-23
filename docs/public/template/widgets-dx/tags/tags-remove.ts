import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.tags('keywords', {
    label: 'Keywords',
    hint: 'Custom remove-button icon and ARIA label',
    placeholder: 'Add a tag…',
    removeIcon: 'delete',
    removeAriaLabel: 'Discard tag',
  }),
];
