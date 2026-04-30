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
    validator: {
      type: 'string',
      required: true,
      messages: {
        required: 'Please pick a car model',
        invalid: 'Please pick a car model',
      },
    },
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
      validator: {
        type: 'string',
        required: true,
        messages: {
          required: 'Choose where you\'ll pick up the car',
        },
      },
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
      validator: {
        type: 'string',
        required: true,
        messages: {
          required: 'Choose where you\'ll drop the car off',
        },
      },
    }),
  ], {
    direction: 'row',
    autoFit: true,
  }),
  gui.inputs.booleanInput('differentReturn', {
    label: 'Choose a different return location',
  }),
  gui.inputs.rangeCalendar('rentalDates', {
    numberOfMonths: 2,
    label: 'Rental dates',
    validator: {
      type: 'array',
      required: true,
      minItems: 1,
      maxItems: 1,
      messages: {
        required: 'Please select your rental dates',
        minItems: 'Pick a rental date range',
        maxItems: 'Only one date range, please',
      },
    },
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
    validator: {
      type: 'string',
      required: true,
      messages: {
        required: 'Choose Daily, Weekly, or Monthly',
      },
    },
  }),
  gui.inputs.booleanInput('driverOver25', {
    label: 'Driver aged over 25',
    validator: {
      type: 'boolean',
      const: true,
      required: true,
      messages: {
        const: 'Drivers must be at least 25 years old to rent',
        required: 'Confirm the driver is over 25',
      },
    },
  }),
  gui.inputs.booleanInput('hasDiscountCode', {
    label: 'I have a discount code',
  }),
  gui.inputs.textInput('discountCode', {
    label: 'Discount code',
    validator: {
      type: 'string',
      required: true,
      minLength: 4,
      messages: {
        required: 'Enter your discount code',
        minLength: 'Discount codes are at least 4 characters',
      },
    },
  }),
  gui.actions.button({
    label: 'Reserve',
    uid: 'submit',
    onClick: 'submit',
  }),
];
