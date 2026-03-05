import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _guiNumberInput } from '../../../services/dx/shortcuts/inputs/guiNumberInput.impl';

export const inputMixedDemo: FormDemoDefinition = {
  title: 'Inputs / Mixed Shortcuts & Objects',
  category: 'Inputs',
  description: 'Combining string shortcuts and full InputDecorator objects in the same _guiInputs call',
  formDef: () => [
    _guiInputs({
      name: 'string',
      height: 'number',
    }),
    _guiNumberInput('age', {
      placeholder: 'age >= 18',
      validator: {
        minimum: 18,
      },
    }),
  ],
};
