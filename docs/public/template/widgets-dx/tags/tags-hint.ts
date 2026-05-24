import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.tags('keywords', {
    label: 'Keywords',
    hint: 'Use Enter, Tab or comma to add a tag',
    placeholder: 'Add a keyword…',
  }),
];
