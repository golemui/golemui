import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.booleanInput('marketingEmails', {
    hint: 'We\'ll only send you relevant product updates.',
    label: 'Receive marketing emails',
  }),
];
