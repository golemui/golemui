import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';

export const formConfigSimplest: FormDemoDefinition = {
  title: 'Form Config',
  description:
    'Form driven form formConfig making all labels blank, it also uses a shortcut that decorates the field under the hood',
  formConfig: {
    decorators: {
      inputs: ({ path }) => ({
        label: '',
        placeholder: `${path}`,
      }),
    },
  },
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
};
