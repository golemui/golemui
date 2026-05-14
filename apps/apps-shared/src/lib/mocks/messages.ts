import { Form } from '@golemui/core';
import { Example } from './types';

const data = {
  username: '',
  age: null,
  score: null,
  rating: null,
  tags: [],
  acceptTerms: null,
  website: '',
  zipCode: '',
};

const resources = {
  en: {
    translation: {
      validation: {
        zipCode: { pattern: 'ZIP code must be exactly 5 digits' },
        website: { format: 'Please enter a valid URL' },
        score: {
          invalid: 'Score must be a number',
          exclusiveMinimum: 'Score must be greater than 0',
          exclusiveMaximum: 'Score must be less than 100',
        },
        tags: {
          required: 'Please select at least one tag',
          minItems: 'Please select at least 2 tags',
        },
      },
    },
  },
};

export const messagesDemo: Example = {
  data,
  form: async () => {
    const baseUrl = new URL('/assets/mocks/messages.form.json', window.location.href).href;
    const json = await fetch(baseUrl).then((r) => r.json());
    return json as unknown as Form<string>;
  },
  resources,
};
