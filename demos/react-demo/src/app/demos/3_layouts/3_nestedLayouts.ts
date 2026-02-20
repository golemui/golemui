import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _guiHorizontalStack } from '../../../services/dx/shortcuts/layouts/guiStack.impl';

export const nestedLayoutsDemo: FormDemoDefinition = {
  title: 'Layouts / Nested',
  category: 'Layouts',
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
