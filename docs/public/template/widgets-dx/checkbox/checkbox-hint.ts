import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.checkbox('newsletter', {
    hint: 'We promise not to spam your inbox.',
    label: 'Subscribe to newsletter',
  }),
];
