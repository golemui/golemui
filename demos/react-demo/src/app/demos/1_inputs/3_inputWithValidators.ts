import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';

export const inputWithValidatorsDemo: FormDemoDefinition = {
  title: 'Inputs / Validators',
  category: 'Inputs',
  description: 'Inputs with validators: minLength on text, minimum on number',
  formDef: () =>
    _guiInputs({
      name: {
        type: 'text',
        label: 'Name',
        placeholder: 'At least 3 characters',
        validator: {
          minLength: 3,
        },
      },
      age: {
        type: 'number',
        label: 'Age',
        placeholder: 'Must be >= 18',
        validator: {
          minimum: 18,
        },
      },
    }),
};
