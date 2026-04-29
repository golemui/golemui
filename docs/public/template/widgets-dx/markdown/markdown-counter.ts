import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.markdown('contentRemaining', {
    counterMode: 'remaining',
    label: 'Content',
    validator: {
      type: 'string',
      maxLength: 200,
      required: true,
    },
  }),
  gui.inputs.markdown('contentCurrent', {
    counterMode: 'current',
    label: 'Content',
    validator: {
      type: 'string',
      maxLength: 200,
      required: true,
    },
  }),
];
