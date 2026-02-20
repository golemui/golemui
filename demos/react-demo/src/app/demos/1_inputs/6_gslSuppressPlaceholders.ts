import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _gslInputs } from '../../../services/dx/shortcuts/inputs/gslInputs.impl';

export const gslSuppressPlaceholdersDemo: FormDemoDefinition = {
  title: 'Inputs / Suppress Placeholders',
  category: 'Inputs',
  description: 'Using _gslInputs({ suppressAutomaticPlaceholders: true }) to remove auto-generated placeholders',
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
  formSelectors: () =>
    _gslInputs({ suppressAutomaticPlaceholders: true }),
};
