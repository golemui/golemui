import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';

export const simplestDemo: FormDemoDefinition = {
  title: 'Simplest Form',
  description: 'Shortcuts for everything',
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
      height: 'number',
    })
  ,
};
