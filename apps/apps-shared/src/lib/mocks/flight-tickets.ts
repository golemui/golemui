import { type Form } from '@golemui/core';
import { type Example } from './types';
import flightTicketsForm from './flight-tickets.form.json';

const data = {};

/**
 * i18next Resource Bundle
 */
const resources = {};

export const flightTickets: Example = {
  data,
  form: flightTicketsForm as unknown as Form<string>,
  resources,
};
