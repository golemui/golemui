import { gui } from '@golemui/gui-shared';

// A static custom validator declared inline on a `textInput`. The validator
// references `allowedNames` by name — the template app registers that schema
// function under `customValidators` (see form.element.ts).
export const extendingCustomValidatorDemo = {
  data: {},
  form: [
    gui.inputs.textInput('user.name', {
      label: 'Username',
      hint: 'Try a name other than John or Jane',
      validator: { type: 'custom', allowedNames: ['John', 'Jane'] },
    }),
  ],
  resources: {},
};

// Cross-field validation: a runtime function pipes the live `password` value
// into the `passwordsMatch` custom validator config, so the schema can compare
// it against `confirmPassword`. Re-runs on every form-data change.
export const extendingPasswordsMatchDemo = {
  data: {},
  form: [
    gui.inputs.password('password', { label: 'Password' }),
    gui.inputs.password('confirmPassword', {
      label: 'Confirm password',
      hint: 'Re-type your password to confirm',
      validator: ({ $form }: any) => ({
        type: 'custom',
        passwordsMatch: $form.password ?? '',
      }),
    }),
  ],
  resources: {},
};
