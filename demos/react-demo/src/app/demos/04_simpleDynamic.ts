import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiFields } from '../../services/formDef/dx/gui/guiFields.impl';

export const simpleDynamicDemo: FormDemoDefinition = {
  title: 'Simple Dynamic',
  description: 'Form driven from formDef shortcuts, note that age has a validator',
  formDef: () =>
    _guiFields({
      name: 'string',
      age: ({ error }: any) => ({
        label: error ? 'Age must be at least 18' : 'Age',
        type: 'number',
        placeholder: 'age >= 18',
        validator: {
          minimum: 18,
        },
      }),
      height: 'number',
    }),
};
