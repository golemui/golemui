import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _gslInputs } from '../../services/dx/shortcuts/gsl/gslInputs.impl';

export const gslSuppressPlaceholdersDemo: FormDemoDefinition = {
  title: 'Inputs / Suppress Placeholders',
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
