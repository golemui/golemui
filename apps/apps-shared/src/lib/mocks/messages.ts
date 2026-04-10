import { golemForm } from '@golemui/gui-shared';
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

const form = golemForm().create({
  form: [
    // string: required + minLength + maxLength with plain string messages
    {
      kind: 'input',
      type: 'textinput',
      path: 'username',
      label: 'Username',
      validator: {
        type: 'string',
        required: true,
        minLength: 4,
        maxLength: 10,
        messages: {
          required: 'Username is required',
          minLength: 'Username must be at least 4 characters',
          maxLength: 'Username must be 10 characters or fewer',
        },
      },
    },

    // string: pattern with i18n TranslationConfig message
    {
      kind: 'input',
      type: 'textinput',
      path: 'zipCode',
      label: 'ZIP Code',
      validator: {
        type: 'string',
        pattern: '^\\d{5}$',
        messages: {
          pattern: {
            key: 'validation.zipCode.pattern',
          },
        },
      },
    },

    // string: format with i18n TranslationConfig message
    {
      kind: 'input',
      type: 'textinput',
      path: 'website',
      label: 'Website',
      validator: {
        type: 'string',
        format: 'url',
        messages: {
          format: {
            key: 'validation.website.format',
          },
        },
      },
    },

    // number: required + minimum + maximum with plain string messages
    {
      kind: 'input',
      type: 'number',
      path: 'age',
      label: 'Age',
      validator: {
        type: 'number',
        required: true,
        minimum: 18,
        maximum: 120,
        messages: {
          invalid: 'Age must be a number',
          minimum: 'You must be at least 18 years old',
          maximum: 'Age cannot exceed 120',
        },
      },
    },

    // number: exclusiveMinimum + exclusiveMaximum with i18n messages
    {
      kind: 'input',
      type: 'number',
      path: 'score',
      label: 'Score (exclusive 0-100)',
      validator: {
        type: 'number',
        exclusiveMinimum: 0,
        exclusiveMaximum: 100,
        messages: {
          invalid: {
            key: 'validation.score.invalid',
          },
          exclusiveMinimum: {
            key: 'validation.score.exclusiveMinimum',
          },
          exclusiveMaximum: {
            key: 'validation.score.exclusiveMaximum',
          },
        },
      },
    },

    // number: multipleOf with plain string message
    {
      uid: 'rating',
      kind: 'input',
      type: 'number',
      path: 'rating',
      label: 'Rating (multiples of 0.5)',
      validator: {
        type: 'number',
        minimum: 0,
        maximum: 5,
        multipleOf: 0.5,
        messages: {
          multipleOf: 'Rating must be a multiple of 0.5',
        },
      },
    },

    // array: required + minItems with i18n messages
    {
      kind: 'input',
      type: 'rangeCalendar',
      path: 'tags',
      label: 'Selected Dates',
      validator: {
        type: 'array',
        required: true,
        minItems: 2,
        maxItems: 5,
        messages: {
          required: {
            key: 'validation.tags.required',
          },
          minItems: {
            key: 'validation.tags.minItems',
          },
          maxItems: 'You can select at most 5 tags',
        },
      },
    },

    // boolean: required (const: true) with plain string message
    {
      kind: 'input',
      type: 'checkbox',
      path: 'acceptTerms',
      label: 'I accept the terms and conditions',
      validator: {
        type: 'boolean',
        const: true,
        messages: {
          invalid: 'You must check',
          const: 'You must accept the terms and conditions to continue',
        },
      },
    },

    {
      uid: 'messages-submit',
      kind: 'action',
      type: 'button',
      label: 'Submit',
      on: { click: 'submit' },
    },
  ],
});

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
  form,
  resources,
};
