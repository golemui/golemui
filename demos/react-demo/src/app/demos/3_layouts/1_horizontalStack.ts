import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _guiHorizontalStack } from '../../../services/dx/shortcuts/layouts/guiStack.impl';

export const horizontalStackDemo: FormDemoDefinition = {
  title: 'Layouts / Horizontal Stack',
  category: 'Layouts',
  description: 'Inputs wrapped in a _guiHorizontalStack layout',
  formDef: () =>
    _guiHorizontalStack(
      _guiInputs({
        name: 'string',
        age: 'number',
        height: 'number',
      }),
    ),
};
