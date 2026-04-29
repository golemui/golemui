import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.textarea('comments', {
    hint: 'Please be descriptive.',
    label: 'Comments',
  }),
];
