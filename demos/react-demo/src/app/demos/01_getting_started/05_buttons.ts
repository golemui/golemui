import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const buttonsDemo: FormDemoDefinition = {
  title: '5. Buttons & Submit',
  category: 'Ch1: Getting Started',
  description:
    'A submit button is auto-generated unless you suppress it. Override it, add custom buttons, ' +
    'or wire your own submit handler. onClick: "submit" promotes any button to the form\'s submit action.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.textInput('email'),
    gui.actions.button({ label: 'Save Draft', onClick: (data) => console.log('Draft:', data) }),
    gui.actions.button({ label: 'Submit', onClick: 'submit' }),
  ],
  formConfig: () => ({ onSubmit: (_data) => alert('Submitted!') }),
};
