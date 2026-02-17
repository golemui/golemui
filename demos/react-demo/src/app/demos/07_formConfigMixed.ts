import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _gslInputs } from '../../services/dx/shortcuts/gsl/gslInputs.impl';

export const formConfigMixed: FormDemoDefinition = {
  title: 'Form Selectors Mixed',
  description: 'Form driven by formSelectors making all labels blank and tweaking them',
  formSelectors: () =>
    _gslInputs({
      suppressAutomaticLabels: true,
      decorator: (baseDef) => ({ placeholder: baseDef.path + ' placeholder' }),
    }),
  formDef: ()=>_guiInputs({
    name: 'string',
    age: (params) => ({
      label: params.errors != null && params.errors.length > 0 ? 'Age must be at least 18' : 'Age',
      type: 'number',
      placeholder: 'age >= 18',
      validator: {
        minimum: 18,
      },
    }),
    height: 'number',
  })
};
