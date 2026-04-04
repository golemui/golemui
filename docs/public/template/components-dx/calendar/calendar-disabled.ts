import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'calendar',
      path: 'appointmentDate',
      defaultValue: '2024-03-21',
      props: {
        disabledRanges: [
          {
            start: '2024-03-10T00:00:00.000Z',
            end: '2024-03-15T23:59:59.999Z',
          },
        ],
      },
    },
  ],
});
