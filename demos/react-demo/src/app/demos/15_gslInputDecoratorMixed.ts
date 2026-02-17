import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _gslInputs } from '../../services/dx/shortcuts/gsl/gslInputs.impl';

export const gslInputDecoratorMixedDemo: FormDemoDefinition = {
  title: 'Inputs / GSL Decorator + Suppress',
  description: 'Combining suppressAutomaticLabels with a decorator callback that adds custom placeholders',
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
