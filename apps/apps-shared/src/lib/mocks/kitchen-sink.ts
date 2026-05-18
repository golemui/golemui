import type { Form } from '@golemui/core';
import { resolveChunkRefs } from '@golemui/gui-shared';
import { type Example } from './types';

const data = {
  listName: 'Development Team',
  currency: 1000000,
  dropdowns: {
    defaultListRenderer: 0,
    disabledList: 0,
    customItemRenderer: 'two',
  },
  lists: {
    defaultListRenderer: 0,
    disabledList: 0,
    customItemRenderer: 'one',
  },
  selects: {
    greeting: 'bye',
    wrongGreeting: 'aaaaaa',
    greetingIndex: 2,
  },
  radiogroups: {
    greeting: 'bye',
    wrongGreeting: 'aaaaaa',
    greetingIndex: 2,
  },
  repeaters: {
    users: [
      {
        firstName: 'Alice',
        lastName: 'Johnson',
      },
      {
        firstName: '',
        lastName: 'Smith',
      },
      {
        firstName: 'Charlie',
      },
      {
        firstName: 'Diana',
        lastName: 'Rodriguez',
      },
    ],
  },
};

/**
 * i18next Resource Bundle
 */
const resources = {};

export const kitchenSink: Example = {
  data,
  form: async () => {
    const baseUrl = new URL('/assets/mocks/kitchen-sink.form.json', window.location.href).href;
    const json = await fetch(baseUrl).then((r) => r.json());
    return resolveChunkRefs(json, baseUrl) as unknown as Form<string>;
  },
  resources,
};
