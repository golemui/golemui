import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiFields } from '../../services/formDef/dx/gui/fields/guiFields.impl';

export const simplestDemo: FormDemoDefinition = {
  title: 'Simplest Form',
  description: 'Shortcuts for everything',
  formDef: () =>
    _guiFields({
      name: 'string',
      age: 'number',
      height: 'number',
    })
  ,
};
