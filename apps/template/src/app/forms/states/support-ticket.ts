import { gui } from '@golemui/gui-shared';

const form = [
  gui.inputs.radiogroup('issueType', {
    label: 'What can we help you with?',
    options: [
      { value: 'bug', label: 'Bug report' },
      { value: 'billing', label: 'Billing question' },
      { value: 'feature', label: 'Feature request' },
      { value: 'other', label: 'Other' },
    ],
    direction: 'row',
  }),

  gui.inputs.textarea('description', {
    label: 'Description',
    placeholder: 'Tell us what happened…',
  }),

  // include with a named state — only render when isBug is active.
  gui.inputs.textarea('reproSteps', {
    label: 'Steps to reproduce',
    placeholder: '1. Go to …\n2. Click …\n3. Notice …',
    include: { in: ['isBug'] },
  }),

  // include with multiple named states — render when ANY is active.
  gui.inputs.radiogroup('priority', {
    label: 'Priority',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ],
    direction: 'row',
    include: { in: ['isBug', 'isBilling'] },
  }),

  // exclude — render unless isBilling is active.
  gui.inputs.checkbox('marketingOk', {
    label: 'You may share my email with our partners.',
    exclude: { from: ['isBilling'] },
  }),

  // toggle + inline `when` — no need to name a state for a one-off condition.
  gui.inputs.booleanInput('subscribeNewsletter', {
    label: 'Subscribe to the product newsletter',
  }),
  gui.inputs.radiogroup('newsletterFrequency', {
    label: 'How often?',
    options: [
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
    ],
    direction: 'row',
    include: { when: '$form.subscribeNewsletter === true' },
  }),

  gui.actions.button({ label: 'Submit ticket', actionType: 'submit' }),
];

const config = {
  states: {
    isBug: '$form.issueType === "bug"',
    isBilling: '$form.issueType === "billing"',
  },
};

export const statesSupportTicketDemo = {
  data: { issueType: 'bug' },
  form,
  config,
  resources: {},
};
