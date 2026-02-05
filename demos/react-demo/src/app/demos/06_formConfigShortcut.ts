import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiFields } from '../../services/formDef/dx/gui/fields/guiFields.impl';

export const formConfigShortcut: FormDemoDefinition = {
  title: 'Form Config',
  description: 'Form driven form formConfig making all labels blank',
  formConfig: {
    suppressAutomaticLabels: true,
  },
  formDef: ()=>
    _guiFields({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
};
