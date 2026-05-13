import { gui } from '@golemui/gui-shared';

// Profile form with three tagged inputs, locked by default,
// unlocked while the `editing` state is active.
const profileForm = [
  gui.inputs.booleanInput('editMode', { label: 'Edit mode' }),
  gui.inputs.textInput('name', { label: 'Name' }, ['profile-field']),
  gui.inputs.textInput('email', { label: 'Email' }, ['profile-field']),
  gui.inputs.textInput('phone', { label: 'Phone' }, ['profile-field']),
];

const profileConfig = {
  states: {
    editing: '$form.editMode === true',
  },
};

// Inline form: each selector spells out the full chain.
export const chainingProfileDemo = {
  data: {},
  form: profileForm,
  config: profileConfig,
  selectors: [
    gui.selectors.tag('profile-field').inputs({
      override: { disabled: true },
    }),
    gui.selectors
      .tag('profile-field')
      .state('editing')
      .inputs({
        override: { disabled: false },
      }),
  ],
  resources: {},
};

// Same form definition, but the selectors share a partial chain.
const profileField = gui.selectors.tag('profile-field');

export const chainingProfileRefactoredDemo = {
  data: {},
  form: profileForm,
  config: profileConfig,
  selectors: [
    profileField.inputs({ override: { disabled: true } }),
    profileField.state('editing').inputs({ override: { disabled: false } }),
  ],
  resources: {},
};
