import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _gslInputs } from '../../../services/dx/shortcuts/gsl/gslInputs.impl';

export const inputCallbackWithGslDecoratorDemo: FormDemoDefinition = {
  title: 'Functions / Input Callback + GSL Decorator',
  category: 'Functions',
  description: 'The age field is a PartialInputDefCallback (FunctionWidget) combined with a GSL static decorator that suppresses labels and adds custom placeholders',
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
  formSelectors: () =>
    _gslInputs({
      suppressAutomaticLabels: true,
      decorator: (baseDef) => ({ placeholder: baseDef.path + ' placeholder' }),
    }),
};
