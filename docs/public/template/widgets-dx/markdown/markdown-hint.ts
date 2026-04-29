import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.markdown('content', {
    hint: 'Supports markdown formatting.',
    label: 'Content',
  }),
];
