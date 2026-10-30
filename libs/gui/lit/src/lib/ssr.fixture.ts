import type { GuiFormInitConfig } from '@golemui/gui-shared';

/**
 * The form of the resume spec. The server render spec renders it to `goldens/resume-form.html`,
 * and the resume spec loads that markup into a DOM.
 */
export const resumeFormConfig: GuiFormInitConfig = {
  formName: 'gui-lit-resume-form',
  formDef: {
    form: {
      uid: 'root',
      kind: 'layout',
      type: 'grid',
      children: [
        {
          kind: 'input',
          type: 'textinput',
          path: 'firstName',
          label: 'First name',
          on: { load: 'firstNameLoaded' },
        },
        { kind: 'input', type: 'number', path: 'seats', label: 'Seats' },
        { kind: 'input', type: 'checkbox', path: 'acceptTerms', label: 'I accept the terms' },
        { kind: 'action', type: 'button', label: 'Send', actionType: 'submit' },
      ],
    },
  },
  data: { firstName: 'Ada', seats: 3, acceptTerms: true },
};
