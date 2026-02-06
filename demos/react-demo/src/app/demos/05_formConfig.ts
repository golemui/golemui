import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiFields } from '../../services/formDef/dx/gui/shortcuts/guiFields.impl';

export const formConfigSimplest: FormDemoDefinition = {
  title: 'Form Config',
  description:
    'Form driven form formConfig making all labels blank, it also uses a shortcut that decorates the field under the hood',
  formConfig: {
    defaultFieldDef: ({ fieldKey }) => ({
      label: '',
      placeholder: `${fieldKey}`,
    }),
  },
  formDef: ()=>
    _guiFields({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
};
