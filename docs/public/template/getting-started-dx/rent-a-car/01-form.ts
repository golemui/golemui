import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.dropdown('car', {
    labelField: 'label',
    valueField: 'id',
    items: [
      {
        id: 'compact',
        label: 'Compact',
      },
      {
        id: 'suv',
        label: 'SUV',
      },
      {
        id: 'convertible',
        label: 'Convertible',
      },
      {
        id: 'luxury',
        label: 'Luxury',
      },
    ],
    label: 'Select car',
  }),
  gui.layouts.grid([
    gui.inputs.dropdown('collectOffice', {
      labelField: 'label',
      valueField: 'id',
      items: [
        {
          id: 'lhr',
          label: 'London Heathrow',
        },
        {
          id: 'cdg',
          label: 'Paris CDG',
        },
        {
          id: 'fra',
          label: 'Frankfurt Main',
        },
      ],
      label: 'Collect from office',
    }),
    gui.inputs.dropdown('returnOffice', {
      labelField: 'label',
      valueField: 'id',
      items: [
        {
          id: 'lhr',
          label: 'London Heathrow',
        },
        {
          id: 'cdg',
          label: 'Paris CDG',
        },
        {
          id: 'fra',
          label: 'Frankfurt Main',
        },
      ],
      label: 'Return to office',
    }),
  ], {
    direction: 'row',
    autoFit: true,
  }),
  gui.inputs.booleanInput('differentReturn', {
    label: 'Choose a different return location',
  }),
  gui.inputs.rangeCalendar('rentalDates', {
    label: 'Rental dates',
  }),
  gui.inputs.radiogroup('rentalType', {
    options: [
      {
        label: 'Daily',
        value: 'daily',
      },
      {
        label: 'Weekly',
        value: 'weekly',
      },
      {
        label: 'Monthly',
        value: 'monthly',
      },
    ],
    label: 'Rental type',
  }),
  gui.inputs.booleanInput('driverOver25', {
    label: 'Driver aged over 25',
  }),
  gui.inputs.booleanInput('hasDiscountCode', {
    label: 'I have a discount code',
  }),
  gui.inputs.textInput('discountCode', {
    label: 'Discount code',
  }),
  gui.actions.submitButton({ label: 'Reserve' }),
];
