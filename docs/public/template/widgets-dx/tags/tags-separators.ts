import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.tags('keywords', {
    label: 'Keywords',
    hint: 'Only Enter or comma commit a tag — Tab and blur do not',
    placeholder: 'Type something and press Enter or ,',
    separators: ['Enter', ','],
  }),
];
