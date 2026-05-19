import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.textarea('commentsRemaining', {
    counterMode: 'remaining',
    label: 'Comments',
    validator: {
      maxLength: 10,
      required: true,
    },
  }),
  gui.inputs.textarea('commentsCurrent', {
    counterMode: 'current',
    label: 'Comments',
    validator: {
      maxLength: 10,
      required: true,
    },
  }),
];
