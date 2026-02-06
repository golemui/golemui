import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiFields } from '../../services/formDef/dx/gui/shortcuts/guiFields.impl';

export const withValidatorDemo: FormDemoDefinition = {
  title: 'With Validator',
  description: 'Form data with a single validator',
  formDef: () =>
    _guiFields({
      name: {
        type: 'text',
        validator: {
          minLength: 3,
        },
      },
    }),
};
