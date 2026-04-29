import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.textInput('user.name', {
    validator: {
      type: 'custom',
      allowedNames: ['John', 'Jane'],
    },
  }),
];
