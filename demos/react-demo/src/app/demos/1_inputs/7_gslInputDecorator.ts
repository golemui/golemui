import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _gslInputs } from '../../../services/dx/shortcuts/inputs/gslInputs.impl';

export const gslInputDecoratorDemo: FormDemoDefinition = {
  title: 'Inputs / GSL Decorator',
  category: 'Inputs',
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
