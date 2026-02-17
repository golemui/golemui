import { FormDemoDefinition } from '../formRegistry.domain';
import { _guiInputs } from '../../services/dx/shortcuts/gui/shortcuts/guiFields.impl';
import { _gslActionById } from '../../services/dx/shortcuts/gsl/gslActionById.impl';

export const gslActionByIdDemo: FormDemoDefinition = {
  title: 'Actions / GSL Action By ID',
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
