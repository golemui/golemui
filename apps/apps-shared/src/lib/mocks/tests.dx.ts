import type { DxDefinitionItem, DxFormConfig } from '@golemui/gui-shared';
import { gui } from '@golemui/gui-shared';
import { type DxModule } from './modular.dx';

const data = {};

const formDef: DxDefinitionItem[] = [
  gui.inputs.textInput('email', {
    label: 'Email',
    placeholder: 'name@company.com',
    validator: {
      required: true,
      format: 'email',
      messages: {
        required: 'Please enter your email address',
        format: "That doesn't look like an email — try name@company.com",
      },
    },
  }),
  gui.inputs.password('password', {
    label: 'Password',
    validator: {
      required: true,
      minLength: 8,
      pattern: '^(?=.*[A-Za-z])(?=.*\\d).+$',
      messages: {
        required: 'Please choose a password',
        minLength: 'Password must be at least 8 characters',
        pattern: 'Password must contain both letters and numbers',
      },
    },
  }),
  gui.inputs.radiogroup('tier', {
    label: 'Account tier',
    defaultValue: 'free',
    options: [
      { value: 'free', label: 'Free' },
      { value: 'pro', label: 'Pro' },
      { value: 'enterprise', label: 'Enterprise' },
    ],
    validator: { type: 'string', required: true },
  }),
  gui.displays.alert({
    text: 'Company details',
    include: { in: ['paidPlan'] },
  }),
  gui.inputs.textInput('company.name', {
    label: 'Company name',
    include: { in: ['paidPlan'] },
    validator: {
      required: true,
      minLength: 2,
      messages: {
        required: 'Please enter your company name',
        minLength: 'Company name must be at least 2 characters',
      },
    },
  }),
  gui.inputs.textInput('company.vatId', {
    label: 'VAT / Tax ID (optional)',
    include: { in: ['paidPlan'] },
  }),
  gui.inputs.numberInput('company.seats', {
    label: 'Seats',
    include: { in: ['paidPlan'] },
    validator: {
      required: true,
      minimum: 5,
      maximum: 1000,
      multipleOf: 1,
      messages: {
        required: 'Tell us how many seats your team needs',
        minimum: 'Paid plans start at 5 seats — enter 5 or more',
        maximum: 'Paid plans max out at 1000 seats — contact sales for larger teams',
        multipleOf: 'Seats must be a whole number',
      },
    },
  }),
  gui.inputs.checkbox('productUpdates', {
    label: 'Send me product updates',
    defaultValue: false,
  }),
  gui.inputs.radiogroup('updateFrequency', {
    label: 'How often should we email you?',
    defaultValue: 'monthly',
    include: { when: '$form.productUpdates === true' },
    options: [
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
    ],
    validator: { type: 'string', required: true },
  }),
  gui.inputs.checkbox('terms', {
    label: 'I accept the Terms of Service and Privacy Policy',
    defaultValue: false,
    validator: {
      const: true,
      messages: {
        const: 'You must accept the terms to create an account',
      },
    },
  }),
  gui.actions.button({
    label: 'Create account',
    actionType: 'submit',
    disabled: { when: '$formIsInvalid' },
  }),
];

const formConfig: DxFormConfig = {
  states: { paidPlan: "$form.tier === 'pro' || $form.tier === 'enterprise'" },
};

export const testsDxModular: DxModule = {
  label: 'Tests',
  data,
  formDef,
  formConfig,
};
