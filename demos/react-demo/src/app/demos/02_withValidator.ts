import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';

export const withValidatorDemo: FormDemoDefinition = {
  title: 'With Validator',
  description: 'Form data with a single validator',
  formDef: () =>
    _guiInputs({
      name: {
        type: 'text',
        validator: {
          minLength: 3,
        },
      },
    }),
};
