import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiSubmitButton } from '../../services/dx/shortcuts/gui/shortcuts/guiSubmitButton.impl';

export const submitButtonDemo: FormDemoDefinition = {
  title: 'Submit Button',
  description: 'Explicit _guiSubmitButton() placed between input groups',
  formDef: () => [
    _guiInputs({
      name: 'string',
      age: 'number',
    }),
    _guiSubmitButton(),
    _guiInputs({
      gender: 'string',
    }),
  ],
};
