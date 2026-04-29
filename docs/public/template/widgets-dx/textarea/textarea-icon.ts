import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.textarea('comments', {
    icon: 'edit_note',
    hint: 'With an icon in the textarea',
    label: 'Comments',
  }),
];
