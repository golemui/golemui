import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiButton } from '../../../services/dx/shortcuts/gui/shortcuts/guiSubmitButton.impl';

export const inputAndActionCallbacksDemo: FormDemoDefinition = {
  title: 'Functions / Input + Action Callbacks',
  category: 'Functions',
  description: 'Both an input and a button use callbacks reacting to the same runtime params. The age label changes on error, and the button disables when name is empty.',
  formDef: () => [
    _guiInputs({
      name: 'string',
      age: (params) => ({
        label: params.errors != null && params.errors.length > 0 ? 'Age must be at least 18' : 'Age',
        type: 'number',
        placeholder: 'age >= 18',
        validator: {
          minimum: 18,
        },
      }),
    }),
    _guiButton((params) => ({
      label: params.$form?.name ? `Save ${params.$form.name}` : 'Save',
      disabled: !params.$form?.name,
      onClick: (data: any) => console.log('Saved:', data),
    })),
  ],
};
