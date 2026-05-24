import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.tags('keywords', {
    label: 'Keywords',
    hint: 'trim is off — leading/trailing whitespace is preserved verbatim',
    placeholder: "Try adding '  spaced  '",
    trim: false,
  }),
];
