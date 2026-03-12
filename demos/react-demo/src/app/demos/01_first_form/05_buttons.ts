import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs, _guiButton, _gslRoot } from '@golemui/gui-shared';

export const buttonsDemo: FormDemoDefinition = {
  title: '5. Buttons & Submit',
  category: 'Ch1: First Form',
  description:
    'A submit button is auto-generated unless you suppress it. Override it, add custom buttons, '
    + 'or wire your own submit handler. onClick: "submit" promotes any button to the form\'s submit action.',
  formDef: () => [
    _guiInputs({ name: 'string', email: 'string' }),
    _guiButton({ label: 'Save Draft', onClick: (data) => console.log('Draft:', data) }),
    _guiButton({ label: 'Submit', onClick: 'submit' }),
  ],
  formSelectors: () => _gslRoot({ onSubmit: (_data) => alert('Submitted!') }),
};
