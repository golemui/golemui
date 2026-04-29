import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.textInput('user.password', {
    label: 'Password',
    validator: {
      type: 'string',
      required: true,
      minLength: 8,
      maxLength: 20,
      pattern: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]+$',
      messages: {
        invalid: 'Please enter your password',
        required: 'Please enter your password',
        minLength: 'Password must be at least 8 characters',
        maxLength: 'Password cannot exceed 20 characters',
        pattern: 'Password must contain both letters and numbers',
      },
    },
  }),
  gui.inputs.numberInput('user.age', {
    label: 'Age',
    validator: {
      type: 'number',
      required: true,
      minimum: 18,
      maximum: 120,
      messages: {
        invalid: 'Please enter a valid number',
        minimum: 'You must be at least 18 years old',
        maximum: 'Age cannot exceed 120',
      },
    },
  }),
  gui.inputs.checkbox('acceptTerms', {
    label: 'I accept the terms and conditions',
    validator: {
      type: 'boolean',
      const: true,
      required: true,
      messages: {
        invalid: 'You must accept terms and conditions',
        required: 'You must accept terms and conditions',
        const: 'You must accept the terms and conditions to continue',
      },
    },
  }),
];
