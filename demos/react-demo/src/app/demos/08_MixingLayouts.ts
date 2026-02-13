import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiStack, _guiHorizontalStack } from '../../services/dx/shortcuts/gui/shortcuts/guiStack.impl';

export const mixingLayouts: FormDemoDefinition = {
  title: 'Mixing Layouts',
  description: 'Basic layout mixing',
  formDef: () => [
    _guiInputs({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
    _guiHorizontalStack(
      _guiInputs({
        married: 'number',
        withChildren: 'number',
      }),
    ),
    _guiInputs({
      occupation: 'string',
    }),
  ],
};
