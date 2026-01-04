export const calendar = (): any => ({
  uid: 'tab11',
  kind: 'layout',
  widget: 'stack',
  children: [
    {
      uid: '',
      kind: 'control',
      widget: 'calendar',
      path: 'calendar',
      props: {
        icon: 'material-icons material-icons-calendar_month',
        prevMonthIcon: 'material-icons material-icons-chevron_left',
        nextMonthIcon: 'material-icons material-icons-chevron_right',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'dateInput',
      path: 'dateInput',
      props: {
        icon: 'material-icons material-icons-calendar_month',
      },
      validator: { type: 'string', format: 'date-time' },
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
      validator: { type: 'string', format: 'date-time' },
    },
  ],
});
