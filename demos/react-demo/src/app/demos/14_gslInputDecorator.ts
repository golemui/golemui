import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _gslInputs } from '../../services/dx/shortcuts/gsl/gslInputs.impl';

export const gslInputDecoratorDemo: FormDemoDefinition = {
  title: 'GSL Input Decorator',
  description: 'Using _gslInputs with a decorator callback to override labels and placeholders for all inputs',
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
  formSelectors: () =>
    _gslInputs({
      decorator: ({ path }) => ({
        label: '',
        placeholder: `${path}`,
      }),
    }),
};
