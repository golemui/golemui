import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _gslInputs } from '../../../services/dx/shortcuts/inputs/gslInputs.impl';

export const gslSuppressLabelsDemo: FormDemoDefinition = {
  title: 'Inputs / Suppress Labels',
  category: 'Inputs',
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
