import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'rangeCalendar',
      path: 'vacationDates',
      defaultValue: [
        {
          start: '2024-07-21',
          end: '2024-07-25',
        },
      ],
      props: {
        disabledRanges: [
          {
            start: '2024-07-04T00:00:00.000Z',
            end: '2024-07-07T23:59:59.999Z',
          },
        ],
      },
    },
  ],
});
