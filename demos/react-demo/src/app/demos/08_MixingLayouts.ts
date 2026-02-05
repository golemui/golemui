import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiFields } from '../../services/formDef/dx/gui/fields/guiFields.impl';
import { _guiStack, _guiHorizontalStack } from '../../services/formDef/dx/gui/fields/guiStack.impl';

export const mixingLayouts: FormDemoDefinition = {
  title: 'Mixing Layouts',
  description: 'Basic layout mixing',
  formDef: () => [
    _guiFields({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
    _guiHorizontalStack(
      _guiFields({
        married: 'number',
        withChildren: 'number',
      }),
    ),
    _guiFields({
      occupation: 'string',
    }),
  ],
};
