import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiButtons } from '../../services/dx/shortcuts/gui/shortcuts/guiSubmitButton.impl';

export const multipleButtonsDemo: FormDemoDefinition = {
  title: 'Actions / Multiple Buttons',
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
