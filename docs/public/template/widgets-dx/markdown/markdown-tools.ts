import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.markdown('content', {
    tools: ['H', 'B', 'I', 'S', '|', 'UL'],
    label: 'Content',
  }),
];
