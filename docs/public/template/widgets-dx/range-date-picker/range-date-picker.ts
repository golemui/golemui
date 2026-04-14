import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'rangeDatePicker',
      path: 'dateRanges',
      label: 'Date Ranges',
    },
  ],
});
