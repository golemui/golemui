import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _gslActionById } from '../../../services/dx/shortcuts/actions/gslActionById.impl';

export const gslActionByIdDemo: FormDemoDefinition = {
  title: 'Actions / GSL Action By ID',
  category: 'Actions',
  description: 'Using _gslActionById to customize the auto-generated submit button with an onClick handler',
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
    }),
  formSelectors: () =>
    _gslActionById('#submit', {
      decorator: { onClick: (data: any) => alert(JSON.stringify(data)) },
    }),
};
