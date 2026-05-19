import { gui } from '@golemui/gui-shared';

// `tag()` scope — a tag-scoped selector decorates only the tagged input.
export const scopeTagDemo = {
  data: {},
  form: [
    gui.inputs.textInput('street', { label: 'Street' }, ['priority']),
    gui.inputs.textInput('city', { label: 'City' }),
    gui.inputs.textInput('zip', { label: 'ZIP' }),
  ],
  selectors: [
    gui.selectors.tag('priority').textInputs({
      override: { hint: 'Required to ship.' },
    }),
  ],
  resources: {},
};

// `state()` scope — a state-scoped selector fires only while the state is active.
export const scopeStateDemo = {
  data: {},
  form: [
    gui.inputs.booleanInput('submitting', { label: 'Mark as submitting' }),
    gui.actions.button({ label: 'Submit' }),
  ],
  config: {
    states: {
      submitting: '$form.submitting === true',
    },
  },
  selectors: [
    gui.selectors.state('submitting').actions({
      override: { disabled: true, label: 'Submitting…' },
    }),
  ],
  resources: {},
};
