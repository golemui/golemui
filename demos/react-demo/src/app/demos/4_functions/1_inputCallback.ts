import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _guiNumberInput } from '../../../services/dx/shortcuts/inputs/guiNumberInput.impl';

export const inputCallbackDemo: FormDemoDefinition = {
  title: 'Functions / Input Callback',
  category: 'Functions',
  description: 'Inputs defined with callback functions that receive runtime params (errors, data). The age field becomes a FunctionWidget.',
  formDef: () => [
    _guiInputs({
      name: 'string',
      height: 'number',
    }),
    _guiNumberInput('age', (params) => ({
        label: params.errors != null && params.errors.length > 0 ? 'Age must be at least 18' : 'Age',
        placeholder: 'age >= 18',
        validator: {
          minimum: 18,
        },
      })),
  ],
};
