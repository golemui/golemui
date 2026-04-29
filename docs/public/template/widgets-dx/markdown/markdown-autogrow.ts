import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.markdown('content', {
    autoGrow: true,
    minimumHeight: 50,
    label: 'Content',
  }),
];
