import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _guiVerticalStack } from '../../services/dx/shortcuts/gui/shortcuts/guiStack.impl';

export const verticalStackDemo: FormDemoDefinition = {
  title: 'Vertical Stack',
  description: 'Inputs wrapped in an explicit _guiVerticalStack (same as auto-stack but explicit)',
  formDef: () =>
    _guiVerticalStack([
      _guiInputs({
        name: 'string',
        age: 'number',
      }),
      _guiInputs({
        height: 'number',
      }),
    ]),
};
