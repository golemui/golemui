import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.markdown('content', {
    defaultOpenPreview: true,
    label: 'Content',
  }),
];
