import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _gslRoot } from '../../../services/dx/shortcuts/gsl/gslRoot.impl';

export const gslRootSuppressSubmitDemo: FormDemoDefinition = {
  title: 'Actions / Suppress Auto-Submit',
  category: 'Actions',
  description: 'Using _gslRoot({ suppressAutomaticSubmit: true }) so no submit button is auto-generated',
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
  formSelectors: () =>
    _gslRoot({ suppressAutomaticSubmit: true }),
};
