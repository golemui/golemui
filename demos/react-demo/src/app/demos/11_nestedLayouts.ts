import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiHorizontalStack } from '../../services/dx/shortcuts/gui/shortcuts/guiStack.impl';

export const nestedLayoutsDemo: FormDemoDefinition = {
  title: 'Nested Layouts',
  description: 'Composing multiple _guiInputs and _guiHorizontalStack in an array for mixed layout',
  formDef: () => [
    _guiInputs({
      name: 'string',
      age: 'number',
      height: 'number',
    }),
    _guiHorizontalStack(
      _guiInputs({
        married: 'boolean',
        withChildren: 'boolean',
      }),
    ),
    _guiInputs({
      occupation: 'string',
    }),
  ],
};
