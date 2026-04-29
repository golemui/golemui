import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.textarea('comments', {
    autoGrow: true,
    minimumHeight: 50,
    label: 'Comments',
  }),
];
