import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiTextInput } from '../../../services/dx/shortcuts/inputs/guiTextInput.impl';
import { _guiNumberInput } from '../../../services/dx/shortcuts/inputs/guiNumberInput.impl';

export const inputWithValidatorsDemo: FormDemoDefinition = {
  title: 'Inputs / Validators',
  category: 'Inputs',
  description: 'Inputs with validators: minLength on text, minimum on number',
  formDef: () => [
    _guiTextInput('name', {
      label: 'Name',
      placeholder: 'At least 3 characters',
      validator: {
        minLength: 3,
      },
    }),
    _guiNumberInput('age', {
      label: 'Age',
      placeholder: 'Must be >= 18',
      validator: {
        minimum: 18,
      },
    }),
  ],
};
