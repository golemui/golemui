import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiFields } from '../../services/formDef/dx/gui/shortcuts/guiFields.impl';

export const manyTypes: FormDemoDefinition = {
  title: 'This form tests many different types of controls',
  description: 'Shortcuts for everything',
  formDef: ()=>_guiFields({
    name: 'string',
    age: 'number',
    height: 'number',
    married: 'boolean',
  }),
};
