import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.datePicker('startDate', {
    hint: 'Provide a start date to calculate your quote.',
    label: 'Start Date',
  }),
];
