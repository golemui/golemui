import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _guiNumberInput } from '../../../services/dx/shortcuts/inputs/guiNumberInput.impl';
import { _gslInputs } from '../../../services/dx/shortcuts/inputs/gslInputs.impl';

export const inputCallbackWithGslDecoratorDemo: FormDemoDefinition = {
  title: 'Functions / Input Callback + GSL Decorator',
  category: 'Functions',
  description: 'The age field is a PartialInputDefCallback (FunctionWidget) combined with a GSL static decorator that suppresses labels and adds custom placeholders',
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
  formSelectors: () =>
    _gslInputs({
      suppressAutomaticLabels: true,
      decorator: (baseDef) => ({ placeholder: baseDef.path + ' placeholder' }),
    }),
};
