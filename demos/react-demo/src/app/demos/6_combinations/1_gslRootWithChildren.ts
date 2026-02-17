import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _gslRoot } from '../../../services/dx/shortcuts/gsl/gslRoot.impl';
import { _gslInputs } from '../../../services/dx/shortcuts/gsl/gslInputs.impl';

export const gslRootWithChildrenDemo: FormDemoDefinition = {
  title: 'Combinations / GSL Root with Children',
  category: 'Combinations',
  description: 'Using _gslRoot with child widget selectors and root defaults combined',
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
  formSelectors: () =>
    _gslRoot(
      _gslInputs({ suppressAutomaticLabels: true }),
      { suppressAutomaticSubmit: true },
    ),
};
