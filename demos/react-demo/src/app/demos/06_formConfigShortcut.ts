import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _gslInputs } from '../../services/dx/shortcuts/gsl/gslInputs.impl';

export const formConfigShortcut: FormDemoDefinition = {
  title: 'Form Selectors Shortcut',
  description: 'Form driven by formSelectors making all labels blank',
  formSelectors: () =>
    _gslInputs({ suppressAutomaticLabels: true }),
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
};
