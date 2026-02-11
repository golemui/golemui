import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/formDef/dx/gui/shortcuts/guiFields.impl';

export const formConfigShortcut: FormDemoDefinition = {
  title: 'Form Config',
  description: 'Form driven form formConfig making all labels blank',
  formConfig: {
    sensibleDefaults: {
      inputs: {
        suppressAutomaticLabels: true
      }
    }
  },
  formDef: ()=>
    _guiInputs({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
};
