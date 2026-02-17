import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';

export const inputMixedDemo: FormDemoDefinition = {
  title: 'Inputs / Mixed Shortcuts & Objects',
  category: 'Inputs',
  description: 'Combining string shortcuts and full InputDecorator objects in the same _guiInputs call',
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: {
        type: 'number',
        placeholder: 'age >= 18',
        validator: {
          minimum: 18,
        },
      },
      height: 'number',
    }),
};
