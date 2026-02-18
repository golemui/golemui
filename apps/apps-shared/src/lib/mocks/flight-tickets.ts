import { defineForm } from '@golemui/core';
import { Example } from './types';

const form = defineForm({
  form: [
    {
      uid: 'tab15',
      kind: 'layout',
      type: 'flex',
      props: { direction: 'horizontal' },
      children: [
        {
          uid: '',
          kind: 'input',
          type: 'dropdown',
          path: 'from',
          label: 'From',
          size: 1,
          props: {
            height: 300,
            itemHeight: 60,
            itemRenderer: 'airportItemRenderer',
            asyncFiltering: true,
            labelField: 'name',
            valueField: 'iata',
            inputDebounce: 300,
            items: [],
          },
          on: {
            load: 'getFromAirports',
            filter: 'getFromAirports',
          },
        },
        {
          uid: '',
          kind: 'input',
          type: 'dropdown',
          path: 'to',
          label: 'To',
          size: 1,
          props: {
            height: 300,
            itemHeight: 60,
            itemRenderer: 'airportItemRenderer',
            asyncFiltering: true,
            labelField: 'name',
            valueField: 'iata',
            inputDebounce: 300,
            items: [],
          },
          on: {
            load: 'getToAirports',
            filter: 'getToAirports',
          },
        },
        {
          uid: '',
          kind: 'input',
          type: 'number',
          path: 'passengers',
          defaultValue: 1,
          label: 'Number of passengers',
        },
      ],
    },
    {
      uid: '',
      kind: 'input',
      type: 'rangeCalendar',
      path: 'dates',
      label: 'Outbound/Return Dates',
      props: {
        icon: 'material-icons material-icons-calendar_month',
        prevMonthIcon: 'material-icons material-icons-chevron_left',
        nextMonthIcon: 'material-icons material-icons-chevron_right',
        minDate: new Date().toISOString().split('T')[0],
        maxDate: '2026-12-31',
        disabledRanges: [],
        numberOfMonths: 2,
      },
    },
  ],
});

const data = {};

/**
 * i18next Resource Bundle
 */
const resources = {};

export const flightTickets: Example = {
  data,
  form,
  resources,
};
