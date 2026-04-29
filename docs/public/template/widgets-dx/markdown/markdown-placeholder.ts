import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.markdown('content', {
    placeholder: 'Write your markdown here...',
    label: 'Content',
  }),
];
