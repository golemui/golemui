import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _gslInputs } from '../../services/dx/shortcuts/gsl/gslInputs.impl';

export const gslSuppressLabelsDemo: FormDemoDefinition = {
  title: 'Inputs / Suppress Labels',
  description: 'Using _gslInputs({ suppressAutomaticLabels: true }) to remove auto-generated labels',
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
  formSelectors: () =>
    _gslInputs({ suppressAutomaticLabels: true }),
};
