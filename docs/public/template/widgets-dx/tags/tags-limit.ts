import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.tags('keywords', {
    label: 'Keywords (max 3)',
    limit: 3,
    placeholder: 'Up to 3 tags',
  }),
];
