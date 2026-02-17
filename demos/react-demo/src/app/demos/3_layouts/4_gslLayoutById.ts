import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _gslLayoutById } from '../../../services/dx/shortcuts/gsl/gslLayoutById.impl';

export const gslLayoutByIdDemo: FormDemoDefinition = {
  title: 'Layouts / GSL Layout By ID',
  category: 'Layouts',
  description: 'Using _gslLayoutById to override the auto-generated root layout direction to horizontal',
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
  formSelectors: () =>
    _gslLayoutById('#root', {
      decorator: { direction: 'horizontal' },
    }),
};
