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
