import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';

export const inputDynamicDemo: FormDemoDefinition = {
  title: 'Dynamic Inputs',
  description: 'Inputs defined with callback functions that receive runtime params (errors, data)',
  formDef: () =>
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
      height: 'number',
    }),
};
