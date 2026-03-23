import { defineForm } from '@golemui/core';
import { Example } from './types';

const data = {
  details: {
    clientName: '',
    date: null,
    isRemote: false,
    notes: '',
  },
};

const form = defineForm({
  form: [
    {
      uid: 'auth-demo',
      kind: 'layout',
      type: 'tabs',
      props: {
        activeTab: 'login',
        tabs: [
          { label: 'Login', uid: 'login-flex' },
          { label: 'Register', uid: 'register-flex' },
        ],
      },
      children: [
        {
          uid: 'login-flex',
          kind: 'layout',
          type: 'grid',
          props: { gap: 20 },
          children: [
            {
              uid: 'login-email',
              kind: 'input',
              type: 'textinput',
              path: 'login.email',
              label: 'Email Address',
              props: { type: 'email', placeholder: 'example@domain.com' },
            },
            {
              uid: 'login-password',
              kind: 'input',
              type: 'textinput',
              path: 'login.password',
              label: 'Password',
              props: { type: 'password', placeholder: 'Enter your password...' },
            },
            {
              uid: 'login-submit',
              kind: 'action',
              type: 'button',
              label: 'Login',
            },
          ],
        },
        {
          uid: 'register-flex',
          kind: 'layout',
          type: 'grid',
          props: { gap: 20 },
          children: [
            {
              uid: 'login-firstName',
              kind: 'input',
              type: 'textinput',
              path: 'login.firstName',
              label: 'First Name',
              props: { placeholder: 'John' },
            },
            {
              uid: 'login-lastName',
              kind: 'input',
              type: 'textinput',
              path: 'login.lastName',
              label: 'Last Name',
              props: { placeholder: 'Doe' },
            },
            {
              uid: 'userCountry',
              kind: 'input',
              type: 'dropdown',
              path: 'userCountry',
              label: 'Country of Residence',
              props: {
                size: 4,
                height: 300,
                itemHeight: 60,
                itemRenderer: 'countryItemRenderer',
                placeholder: {
                  key: 'travelPlanner.field.userCountry.placeholder',
                  default: 'Select a Country',
                },
                labelField: 'label',
                valueField: 'id',
                items: [
                  { id: 'AU', flag: '🇦🇺', label: 'Australia' },
                  { id: 'BR', flag: '🇧🇷', label: 'Brazil' },
                  { id: 'CA', flag: '🇨🇦', label: 'Canada' },
                  { id: 'CN', flag: '🇨🇳', label: 'China' },
                  { id: 'FR', flag: '🇫🇷', label: 'France' },
                  { id: 'DE', flag: '🇩🇪', label: 'Germany' },
                  { id: 'IN', flag: '🇮🇳', label: 'India' },
                  { id: 'IT', flag: '🇮🇹', label: 'Italy' },
                  { id: 'JP', flag: '🇯🇵', label: 'Japan' },
                  { id: 'MX', flag: '🇲🇽', label: 'Mexico' },
                  { id: 'KR', flag: '🇰🇷', label: 'South Korea' },
                  { id: 'ES', flag: '🇪🇸', label: 'Spain' },
                  { id: 'UK', flag: '🇺🇦', label: 'Ukraine' },
                  { id: 'US', flag: '🇺🇸', label: 'United States' },
                  { id: 'GB', flag: '🇬🇧', label: 'United Kingdom' },
                ],
              },
            },
            {
              uid: '',
              kind: 'input',
              type: 'dateInput',
              path: 'dateInput',
              label: 'Date of Birth',
              props: {
                icon: 'calendar_month',
              },
            },
            {
              uid: 'reg-email',
              kind: 'input',
              type: 'textinput',
              path: 'register.email',
              label: 'Email Address',
              props: {
                type: 'email',
                placeholder: 'example@domain.com',
                hint: 'We will send you a confirmation email to verify your account.',
              },
            },
            {
              uid: '',
              kind: 'input',
              type: 'checkbox',
              label: 'Accept Terms of Service and Privacy Policy',
              path: 'confirm',
              props: {
                checkboxPosition: 'left',
                hint: 'I confirm I am 18 years of age or older. By clicking Create Account, I agree to the Terms of Service and Privacy Policy.',
              },
              validator: { type: 'boolean', required: true },
            },
            {
              uid: 'register-submit',
              kind: 'action',
              type: 'button',
              label: 'Create Account',
            },
          ],
        },
      ],
    },
  ],
});

/**
 * i18next Resource Bundle
 */

const resources = {};

export const a11yDemo: Example = {
  data,
  form,
  resources,
};
