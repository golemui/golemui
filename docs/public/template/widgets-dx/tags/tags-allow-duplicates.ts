import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.tags('keywords', {
    label: 'Keywords',
    hint: 'Try adding the same tag twice — the second attempt is silently ignored',
    placeholder: 'Add a tag…',
    allowDuplicates: false,
  }),
];
