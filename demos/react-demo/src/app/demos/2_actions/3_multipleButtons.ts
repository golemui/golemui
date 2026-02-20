import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _guiButtons } from '../../../services/dx/shortcuts/actions/guiActions.impl';

export const multipleButtonsDemo: FormDemoDefinition = {
  title: 'Actions / Multiple Buttons',
  category: 'Actions',
  description: 'Multiple action buttons defined with _guiButtons in a single call',
  formDef: () => [
    _guiInputs({
      name: 'string',
      email: 'string',
    }),
    _guiButtons([
      {
        label: 'Save Draft',
        onClick: (data: any) => console.log('Draft saved:', data),
      },
      {
        label: 'Submit',
        onClick: 'submit',
      },
      {
        label: 'Reset',
        onClick: () => console.log('Form reset'),
      },
    ]),
  ],
};
