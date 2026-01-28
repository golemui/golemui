export const calendar = (): any => ({
  uid: 'tab12',
  kind: 'layout',
  widget: 'stack',
  children: [
    {
      uid: '',
      kind: 'control',
      widget: 'rangeCalendar',
      path: 'rangeCalendar',
      defaultValue: [{ start: '2026-02-13', end: '2026-02-16' }, { start: '2026-02-20' }],
      props: {
        icon: 'material-icons material-icons-calendar_month',
        prevMonthIcon: 'material-icons material-icons-chevron_left',
        nextMonthIcon: 'material-icons material-icons-chevron_right',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'calendar',
      path: 'calendar',
      defaultValue: '2026-02-13',
      props: {
        icon: 'material-icons material-icons-calendar_month',
        prevMonthIcon: 'material-icons material-icons-chevron_left',
        nextMonthIcon: 'material-icons material-icons-chevron_right',
      },
      validator: { type: 'string', required: true, format: 'date' },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'dateInput',
      path: 'dateInput',
      props: {
        icon: 'material-icons material-icons-calendar_month',
      },
      validator: { type: 'string', required: true, format: 'date' },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'datePicker',
      path: 'datePicker',
      props: {
        icon: 'material-icons material-icons-calendar_month',
        prevMonthIcon: 'material-icons material-icons-chevron_left',
        nextMonthIcon: 'material-icons material-icons-chevron_right',
      },
      validator: { type: 'string', required: true, format: 'date' },
    },
  ],
});
