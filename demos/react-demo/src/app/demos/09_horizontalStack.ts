import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiHorizontalStack } from '../../services/dx/shortcuts/gui/shortcuts/guiStack.impl';

export const horizontalStackDemo: FormDemoDefinition = {
  title: 'Layouts / Horizontal Stack',
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
