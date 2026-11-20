import type { GuiFormInitConfig } from '@golemui/gui-shared';

// The same form as the Vue, React and Lit harnesses, so the SSR harnesses stay directly
// comparable. No tabs, no markdown, and no calendar, so the render does not depend on the
// server clock.
const formDef = {
  form: [
    {
      kind: 'layout',
      type: 'grid',
      props: { direction: 'row' },
      children: [
        {
          kind: 'input',
          type: 'textinput',
          uid: 'firstName',
          path: 'firstName',
          label: 'First name',
          validator: { type: 'string', required: true, minLength: 2 },
          props: { placeholder: 'Ada' },
        },
        {
          kind: 'input',
          type: 'textinput',
          uid: 'lastName',
          path: 'lastName',
          label: 'Last name',
          validator: { type: 'string', required: true, minLength: 2 },
          props: { placeholder: 'Lovelace' },
        },
      ],
    },
    {
      kind: 'input',
      type: 'number',
      uid: 'seats',
      path: 'seats',
      label: 'Seats',
      validator: { type: 'number', required: true, minimum: 1 },
      props: { placeholder: 'seats' },
    },
    {
      kind: 'input',
      type: 'select',
      uid: 'plan',
      path: 'plan',
      label: 'Plan',
      validator: { type: 'string', required: true },
      props: {
        options: [
          { value: 'free', label: 'Free' },
          { value: 'pro', label: 'Pro' },
          { value: 'enterprise', label: 'Enterprise' },
        ],
        placeholder: 'plan',
      },
    },
    {
      kind: 'input',
      type: 'checkbox',
      uid: 'acceptTerms',
      path: 'acceptTerms',
      label: 'I accept the terms',
      validator: { type: 'boolean', required: true },
    },
    {
      kind: 'action',
      type: 'button',
      label: 'Create account',
      actionType: 'submit',
    },
  ],
};

// Server rendering requires an explicit formName: it is what makes the server and the
// client produce the same form id.
export const config: GuiFormInitConfig = {
  formName: 'harness-form',
  formDef,
  data: {
    firstName: 'Ada',
    lastName: 'Lovelace',
    seats: 3,
    plan: 'pro',
    acceptTerms: false,
  },
};
